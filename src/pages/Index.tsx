import { useState, useEffect } from "react";
import { AddTask } from "@/components/AddTask";
import { TaskItem } from "@/components/TaskItem";
import { Task } from "@/types/task";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (newTask: Omit<Task, "id" | "completed">) => {
    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Tasks</h1>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AddTask onAdd={addTask} />
        </div>

        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;