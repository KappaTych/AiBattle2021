using Microsoft.ClearScript;
using Microsoft.ClearScript.V8;
using System.Text.Json;
using System;

using System.Text;
using System.Collections.Generic;
using System.IO;
using System.Threading;

namespace AiBattle.TestServer
{
    public record Logs(List<string> LogsList)
    {
        public void WriteToLogs(string text) => LogsList.Add(text);

        public void SaveLogsToFile(string path = "consoleLogs.txt") => File.WriteAllText(path, string.Join(Environment.NewLine, LogsList));
    }

    public record Config(string MapPath,
                               string OutPath,
                               bool IsRandomSpawn,
                               int InitTimeout,
                               int TurnTimeout,
                               bool IsLogging);

    public record SceneInitParams(Config Config, string[] BotPaths);

    public class Program
    {
        private static void Main(string[] arg)
        {
            Tester tester = new(new(JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json")), arg));
            tester.Run();
        }
    }

    internal class Tester
    {
        private static readonly string[] _colors =
        {
        "black",
        "blue",
        "green",
        "grey",
        "pink",
        "purple",
        "red",
        "yellow"
    };

        private bool _isInterupted = true;
        private const string _buffVar = "buffVar";
        private readonly object _locker = new();
        private readonly V8ScriptEngine _engine = new();
        private readonly string _script;
        private readonly int _initTimeout;
        private readonly int _turnTimeout;
        private readonly int _botCount;
        private readonly bool _isLogging;
        private readonly Logs? _consoleLogs;
        private readonly string _outPath;
        private string? _errMes;

        public Tester(SceneInitParams sceneInitParams)
        {
            _initTimeout = sceneInitParams.Config.InitTimeout;
            _turnTimeout = sceneInitParams.Config.TurnTimeout;
            _botCount = sceneInitParams.BotPaths.Length;
            _isLogging = sceneInitParams.Config.IsLogging;
            _outPath = sceneInitParams.Config.OutPath;

            if (_isLogging)
                _consoleLogs = new(new());

            StringBuilder controllersTexts = new();
            foreach (var path in sceneInitParams.BotPaths)
                controllersTexts.Append($"'{File.ReadAllText(path)}',");
            controllersTexts.Remove(controllersTexts.Length - 1, 1);

            StringBuilder names = new();
            foreach (var name in sceneInitParams.BotPaths)
                names.Append($"'{name}',");
            names.Remove(names.Length - 1, 1);

            StringBuilder colors = new();
            for (int i = 0; i < sceneInitParams.BotPaths.Length; i++)
                colors.Append($"'{_colors[i]}',");
            colors.Remove(colors.Length - 1, 1);

            _script = SceneScript(File.ReadAllText(sceneInitParams.Config.MapPath),
                                  controllersTexts.ToString(),
                                  names.ToString(),
                                  colors.ToString(),
                                  sceneInitParams.Config.IsRandomSpawn.ToString().ToLower(),
                                  sceneInitParams.Config.InitTimeout,
                                  "null");

            if (_isLogging)
                _consoleLogs!.WriteToLogs(_script);
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
                            _consoleLogs!.WriteToLogs(isSett ?
                                $"bot #{i} init successfull" :
                                $"bot #{i} init failed");
                        }
                    }
                    else
                    {
                        if (_isLogging)
                            _consoleLogs!.WriteToLogs($"bot #{i} init failed");
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
                                _consoleLogs!.WriteToLogs(isSet ?
                                $"bot #{i} dirGet {turn} successfull" :
                                $"bot #{i} dirGet {turn} failed SetBotController");
                            }
                        }
                        else
                        {
                            if (_isLogging)
                                _consoleLogs!.WriteToLogs($"bot #{i} dirGet {turn} failed");
                        }
                    }
                    _engine.Evaluate("scene.UpdateSnowOnFileds()");
                    _engine.Evaluate("scene.AddTurnToLogs()");
                }
            }
            catch (Exception ex)
            {
                _errMes = ex.Message;
            }
            finally
            {
                if (_isLogging)
                    _consoleLogs!.SaveLogsToFile();

                File.WriteAllText("replay.json", (string)_engine.Evaluate("scene.GetLogs()"));

                dynamic scores = (ScriptObject)_engine.Evaluate("scene.CalcScores()");
                List<string> ans = new();
                foreach (ScriptObject score in scores)
                    ans.Add($"{score.GetProperty("botName")}:{score.GetProperty("value")}");

                if (_errMes != null)
                {
                    ans.Add("err = true");
                    ans.Add(_errMes);
                }

                File.WriteAllLines(_outPath, ans);

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
                    _consoleLogs!.WriteToLogs($"Bot {botIndex} init thread exception:{ex.Message}");
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
                    _consoleLogs!.WriteToLogs($"Bot {botIndex} getDir thread exception:{ex.Message}");
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
}
