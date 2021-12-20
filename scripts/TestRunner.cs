using Microsoft.ClearScript;
using Microsoft.ClearScript.V8;
using System.Text.Json;

using System.Text;

namespace AiBattle.TestServer;

public record class SceneInitParams(string MapPath,
                                     List<string> BotsNames,
                                     List<string> BotsControllersPath,
                                     List<string> BotsColors,
                                     bool IsRandomSpawn,
                                     int InitTimeout,
                                     int TurnTimeout,
                                     bool IsLogging);

public class Program
{
    private static void Main(string[] arg)
    {
        var filePath = arg.Length > 0 ? arg[0] : Console.ReadLine();
        Tester tester = new(JsonSerializer.Deserialize<SceneInitParams>(File.ReadAllText(filePath)));
        tester.Run();
    }
}

internal class Tester
{
    private bool _isInterupted = true;
    private const string _buffVar = "buffVar";
    private readonly object _locker = new();
    private V8ScriptEngine _engine = new();
    private string _script;
    private int _initTimeout;
    private int _turnTimeout;
    private int _botCount;
    private bool _isLogging;

    public Tester(SceneInitParams sceneInitParams)
    {
        _initTimeout = sceneInitParams.InitTimeout;
        _turnTimeout = sceneInitParams.TurnTimeout;
        _botCount = sceneInitParams.BotsNames.Count;
        _isLogging = sceneInitParams.IsLogging;

        StringBuilder controllersTexts = new();
        foreach (var path in sceneInitParams.BotsControllersPath)
            controllersTexts.Append($"'{File.ReadAllText(path)}',");
        controllersTexts.Remove(controllersTexts.Length - 1, 1);

        StringBuilder names = new();
        foreach (var name in sceneInitParams.BotsNames)
            names.Append($"'{name}',");
        names.Remove(names.Length - 1, 1);

        StringBuilder colors = new();
        foreach (var name in sceneInitParams.BotsNames)
            colors.Append($"'{name}',");
        colors.Remove(colors.Length - 1, 1);

        _script = SceneScript(File.ReadAllText(sceneInitParams.MapPath),
                              controllersTexts.ToString(),
                              names.ToString(),
                              colors.ToString(),
                              sceneInitParams.IsRandomSpawn.ToString().ToLower(),
                              sceneInitParams.InitTimeout,
                              "null");

        if (_isLogging)
        {
            Console.WriteLine(_script);
        }
    }

    public void Run()
    {
        try
        {
            _engine.DocumentSettings.AccessFlags = DocumentAccessFlags.EnableFileLoading;
            LoadScripts();

            _engine.Evaluate(_script);
            var scene = (ScriptObject)_engine.Evaluate("scene");

            for (var i = 0; i < _botCount; ++i)
            {
                ScriptObject? ans = null;
                Thread thread = new(new ThreadStart(() => BotInit(i, out ans)));
                _isInterupted = false;
                thread.Start();
                thread.Join(_initTimeout);
                WaitInterup();
                if (ans != null)
                {
                    var isSett = (bool)_engine.Evaluate($"SetBotController(scene,{i}, {_buffVar});");

                    if (_isLogging)
                    {
                        Console.WriteLine(isSett ?
                            $"bot #{i} init successfull" :
                            $"bot #{i} init failed");
                    }
                }
                else
                {
                    if (_isLogging)
                    {
                        Console.WriteLine($"bot #{i} init failed");
                    }
                }
            }

            var turns = (int)scene.GetProperty("startTurnsCount");

            for (var turn = 1; turn <= turns; ++turn)
            {
                var isNewTurn = _engine.Evaluate("scene.DecTurns()");
                for (var i = 0; i < _botCount; ++i)
                {
                    ScriptObject? ans = null;
                    Thread thread = new(new ThreadStart(() => BotGetDir(i, out ans)));
                    _isInterupted = false;
                    thread.Start();
                    thread.Join(_turnTimeout);
                    WaitInterup();
                    if (ans != null)
                    {
                        _engine.Evaluate($"scene.UpdateDynamicLayerAfterBotChooseDirection({i}, {_buffVar}.dir)");
                        var isSet = (bool)_engine.Evaluate($"SetBotController(scene,{i}, {_buffVar}.controller);");
                        if (_isLogging)
                        {
                            Console.WriteLine(isSet ?
                            $"bot #{i} dirGet {turn} successfull" :
                            $"bot #{i} dirGet {turn} failed SetBotController");
                        }
                    }
                    else
                    {
                        if (_isLogging)
                        {
                            Console.WriteLine($"bot #{i} dirGet {turn} failed");
                        }
                    }
                }
                _engine.Evaluate("scene.UpdateSnowOnFileds()");
                _engine.Evaluate("scene.AddTurnToLogs()");
            }

            dynamic scores = (ScriptObject)_engine.Evaluate("scene.CalcScores()");
            foreach (ScriptObject score in scores)
                Console.WriteLine($"{score.GetProperty("botName")}:{score.GetProperty("value")}");
        }
        finally
        {
            File.WriteAllText("log.json", (string)_engine.Evaluate("scene.GetLogs()"));
            _engine.Dispose();
        }
    }

    private void WaitInterup()
    {
        var state = true;
        while (state)
        {
            _engine.Interrupt();
            lock (_locker)
            {
                state = !_isInterupted;
            }
        }
    }

    private void LoadScripts()
    {
        var scriptsPath = @".\";
        string[] files =
        {
        "GameObject.js",
        "StaticObject.js",
        "MovableObject.js",
        "ResourceLoader.js",
        "SafeEval.js",
        "Scene.js"
    };

        _engine.ExecuteDocument(@"ImageFake.js");

        foreach (var file in files)
            _engine.ExecuteDocument(scriptsPath + file);
    }

    private static string SceneScript(string mapInfo,
                              string controllersTexts,
                              string botNames,
                              string botColors,
                              string isRandomSpawn,
                              int timeout,
                              string onComplete)
    => File.ReadAllText("SceneSimulator.js")
           .Replace("$mapInfo", mapInfo)
           .Replace("$controllerTexts", controllersTexts.Replace("\n", "").Replace("\r", ""))
           .Replace("$botNames", botNames)
           .Replace("$botColors", botColors)
           .Replace("$isRandomSpawn", isRandomSpawn)
           .Replace("$timeout", timeout.ToString())
           .Replace("$onComplete", onComplete);

    private void BotInit(int botIndex, out ScriptObject? bot)
    {
        try
        {
            bot = (ScriptObject)_engine.Evaluate($"{_buffVar} = InitBotClone(scene, {botIndex}); {_buffVar}");
        }
        catch (Exception ex)
        {
            bot = null;
            if (_isLogging)
            {
                Console.WriteLine($"Bot {botIndex} init thread exception:{ex.Message}");
            }
        }
        finally
        {
            lock (_locker)
            {
                _engine.Interrupt();
                _isInterupted = true;
            }
        }
    }

    private void BotGetDir(int botIndex, out ScriptObject? bot)
    {
        try
        {
            bot = (ScriptObject)_engine.Evaluate($"{_buffVar} = GetDirBotClone(scene, {botIndex}); {_buffVar}");
        }
        catch (Exception ex)
        {
            bot = null;
            if (_isLogging)
            {
                Console.WriteLine($"Bot {botIndex} getDir thread exception:{ex.Message}");
            }
        }
        finally
        {
            lock (_locker)
            {
                _engine.Interrupt();
                _isInterupted = true;
            }
        }
    }
}