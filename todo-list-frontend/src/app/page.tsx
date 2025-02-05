'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Edit, Trash2, Filter } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/components/ContextProvider';
import { useQuery } from './hooks';

export default function Home() {
  const router = useRouter();

  const session = useSessionContext()
  const accountId = session?.account.id;
  const { result: tasks_data = [] } = useQuery<any>("get_user_tasks", { user_id: accountId ? accountId : "", pointer: 0, n_tasks: 10 });

  console.log("tasks_data", tasks_data);

  const [tasks, setTasks] = useState([
    { id: 1, title: "Finish Chromia project", description: "Complete all pending tasks", dueDate: "2024-02-10", completed: false },
    { id: 2, title: "Update documentation", description: "Ensure all API endpoints are covered", dueDate: "2024-02-15", completed: true },
  ]);
  const [filter, setFilter] = useState("all");

  const toggleComplete = (id: any) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id: any) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const editTask = (id: any) => {
    router.push(`/edit-task/${id}`);
  };

  const sortByDueDate = () => {
    setTasks([...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#1c1c28] text-[#f5f5f5] flex flex-col items-center py-10 px-5">
      <h1 className="text-4xl font-bold mb-5 text-[#007bff]">TaskFlow</h1>

      <div className="w-full max-w-md flex justify-between mb-5">
        <Button onClick={() => router.push('/new-task')} className="bg-[#007bff] hover:bg-[#0056b3] flex items-center gap-2">
          <Plus size={20} /> Add Task
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setFilter("all")} className={`${filter === "all" ? "text-blue-500" : "text-gray-400"}`}>All</Button>
          <Button variant="ghost" onClick={() => setFilter("completed")} className={`${filter === "completed" ? "text-green-500" : "text-gray-400"}`}>Completed</Button>
          <Button variant="ghost" onClick={() => setFilter("incomplete")} className={`${filter === "incomplete" ? "text-yellow-500" : "text-gray-400"}`}>Incomplete</Button>
          <Button variant="ghost" onClick={sortByDueDate} className="text-purple-500 flex items-center gap-1">
            <Filter size={16} /> Due Date
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-5 bg-[#28293e] border border-gray-700 rounded-lg shadow-lg">
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h2 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>{task.title}</h2>
                <div className="flex gap-2">
                  <CheckCircle
                    size={24}
                    className={`cursor-pointer ${task.completed ? 'text-green-500' : 'text-gray-500'}`}
                    onClick={() => toggleComplete(task.id)}
                  />
                  <Edit size={20} className="text-yellow-500 cursor-pointer" onClick={() => editTask(task.id)} />
                  <Trash2 size={20} className="text-red-500 cursor-pointer" onClick={() => deleteTask(task.id)} />
                </div>
              </div>
              <p className="text-gray-300 text-sm">{task.description}</p>
              <p className="text-gray-400 text-xs">Due: {task.dueDate}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
