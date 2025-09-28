import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { getBotResponse } from "./ai";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Чат
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Плейлист задач
  const [tasks, setTasks] = useState([]);
  const [inputTask, setInputTask] = useState("");
  const [newTaskIds, setNewTaskIds] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);

  // Таймер
  const initialTime = 25 * 60;
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Автопрокрутка чата
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  // Таймер
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prev) => {
          if (prev > 0) return prev - 1;
          clearInterval(timer);
          setIsRunning(false);
          setShowConfirm(true);
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const progress = Math.max(0, Math.min(100, (time / initialTime) * 100));

  // ===== Задачи =====
  const addTask = (text) => {
    const t = text?.trim();
    if (!t) return;
    const newTask = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text: t,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    highlightTasks([newTask.id]);
  };

  const toggleTask = (index) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    if (currentTaskIndex === index) setCurrentTaskIndex(null);
  };

  const startTask = (index) => {
    if (index < 0 || index >= tasks.length) return;
    setCurrentTaskIndex(index);
    setTime(initialTime);
    setIsRunning(true);
  };

  const handleConfirm = (done) => {
    setShowConfirm(false);
    if (done && currentTaskIndex !== null) {
      toggleTask(currentTaskIndex);
      if (currentTaskIndex + 1 < tasks.length) {
        startTask(currentTaskIndex + 1);
      } else {
        setCurrentTaskIndex(null);
      }
    }
  };

  const highlightTasks = (ids) => {
    if (!ids || ids.length === 0) return;
    setNewTaskIds((prev) => [...prev, ...ids]);
    setTimeout(() => {
      setNewTaskIds((prev) => prev.filter((id) => !ids.includes(id)));
    }, 2500);
  };

  const parseListItems = (text) => {
    const lines = text.split("\n");
    const items = [];
    for (let line of lines) {
      const l = line.trim();
      const m1 = l.match(/^[*-]\s+(.+)$/);
      if (m1) {
        items.push(m1[1].trim());
        continue;
      }
      const m2 = l.match(/^\d+\.\s+(.+)$/);
      if (m2) {
        items.push(m2[1].trim());
      }
    }
    return items;
  };

  const addTasksFromText = (text) => {
    const items = parseListItems(text);
    if (!items.length) return [];
    const createdIds = [];
    setTasks((prev) => {
      const copy = [...prev];
      for (const it of items) {
        const newTask = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          text: it,
          completed: false,
        };
        copy.push(newTask);
        createdIds.push(newTask.id);
      }
      return copy;
    });
    highlightTasks(createdIds);
    return createdIds;
  };

  // ===== Чат =====
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = { sender: "user", text: chatInput };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    setIsBotTyping(true);
    try {
      const reply = await getBotResponse(userMessage.text || "");
      const hasList = /\n\s*[-*]\s+|\n\s*\d+\./.test(reply);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: reply, withList: hasList },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Извините, ошибка AI. Попробуйте позже.",
          withList: false,
        },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex gap-1 px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-fit">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-purple-500 rounded-full inline-block"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
        />
      ))}
    </div>
  );

  // ===== Render =====
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 drop-shadow">
              🎧 Плейлист СДВГшника
            </h1>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition"
            >
              {darkMode ? "🌞 Светлая" : "🌙 Тёмная"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Левая часть: чат + задачи */}
            <div className="flex flex-col gap-8">
              {/* Чат */}
              <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-purple-200 dark:border-gray-700 flex flex-col h-[480px]">
                <h2 className="text-lg font-bold mb-3 text-purple-600 dark:text-purple-300">
                  💬 Чат
                </h2>
                <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                          msg.sender === "user"
                            ? "bg-purple-500 text-white self-end ml-auto"
                            : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-800 self-start"
                        }`}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </motion.div>
                      {msg.sender === "bot" && msg.withList && (
                        <button
                          onClick={() => addTasksFromText(msg.text)}
                          className="ml-2 text-sm px-2 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                        >
                          ➕ Добавить в задачи
                        </button>
                      )}
                    </div>
                  ))}
                  {isBotTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Напиши что-нибудь..."
                    className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                  >
                    ➤
                  </button>
                </div>
              </div>

              {/* Плейлист задач */}
              <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-purple-200 dark:border-gray-700 flex flex-col h-[480px]">
                <h2 className="text-lg font-bold mb-3 text-purple-600 dark:text-purple-300">
                  📋 Плейлист задач
                </h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={inputTask}
                    onChange={(e) => setInputTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTask(inputTask);
                        setInputTask("");
                      }
                    }}
                    placeholder="Новая задача..."
                    className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      addTask(inputTask);
                      setInputTask("");
                    }}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                  >
                    +
                  </button>
                </div>
                <ul className="space-y-2 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {tasks.map((task, index) => (
                      <motion.li
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          currentTaskIndex === index
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-purple-50 dark:bg-gray-700"
                        } ${
                          newTaskIds.includes(task.id)
                            ? "ring-2 ring-green-300"
                            : ""
                        }`}
                      >
                        <span
                          className={`${
                            task.completed ? "line-through text-gray-400" : ""
                          }`}
                        >
                          {task.text}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleTask(index)}
                            className={`px-2 py-1 rounded-lg text-sm ${
                              task.completed
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            {task.completed ? "✔" : "○"}
                          </button>
                          <button
                            onClick={() => deleteTask(index)}
                            className="px-2 py-1 rounded-lg text-sm bg-red-500 text-white"
                          >
                            ✖
                          </button>
                          <button
                            onClick={() => startTask(index)}
                            className="px-2 py-1 rounded-lg text-sm bg-blue-500 text-white"
                          >
                            ▶
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>

            {/* Правая часть: текущий шаг + таймер */}
            <div className="flex flex-col gap-8">
              {/* Текущий шаг */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-2xl shadow-xl flex-1 flex flex-col items-center justify-center">
                <h2 className="text-xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">
                  🔎 Текущий шаг
                </h2>
                {currentTaskIndex !== null && tasks[currentTaskIndex] ? (
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      {tasks[currentTaskIndex].text}
                    </p>
                    {tasks[currentTaskIndex].completed && (
                      <p className="text-lg text-green-600 font-medium">
                        ✔ Выполнено
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-lg">
                    Пока ничего не выбрано
                  </div>
                )}
              </div>

              {/* Таймер */}
              <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm p-5 rounded-2xl shadow-lg flex-1 flex flex-col items-center justify-center relative">
                <h2 className="text-lg font-bold mb-3 text-blue-600 dark:text-blue-300">
                  ⏱ Фокус-таймер
                </h2>
                <div className="text-4xl font-mono text-blue-700 dark:text-blue-200 mb-4">
                  {String(Math.floor(time / 60)).padStart(2, "0")}:
                  {String(time % 60).padStart(2, "0")}
                </div>
                <div className="w-full h-4 bg-blue-200 dark:bg-blue-900 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-4 bg-blue-500 dark:bg-blue-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRunning(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    ▶ Старт
                  </button>
                  <button
                    onClick={() => setIsRunning(false)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    ⏸ Пауза
                  </button>
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setTime(initialTime);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    ⏹ Сброс
                  </button>
                </div>

                {showConfirm && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg text-center space-y-4">
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Задача выполнена?
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => handleConfirm(true)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                          ✔ Да
                        </button>
                        <button
                          onClick={() => handleConfirm(false)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          ✖ Нет
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
