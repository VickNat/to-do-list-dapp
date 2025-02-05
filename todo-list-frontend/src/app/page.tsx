'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Edit, Trash2, Filter } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/components/ContextProvider';
import { useQuery } from './hooks';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type FilterType = "all" | "completed" | "incomplete" | "sorted";

// A simple helper to check if two task arrays are equal based on their ids.
function tasksEqual(a: any[], b: any[]) {
  if (a.length !== b.length) return false;
  return a.every((task, idx) => task.id === b[idx].id);
}

export default function Home() {
  const router = useRouter();
  const { session } = useSessionContext();
  const accountId = session?.account.id;

  // Manage the selected filter
  const [filter, setFilter] = useState<FilterType>("all");
  const [tasks, setTasks] = useState<any[]>([]);

  // state for editing a task
  const [editTaskId, setEditTaskId] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "" });


  // Map filters to the corresponding query names and parameters
  const queryMapping: Record<FilterType, { query: string; params: any }> = {
    all: {
      query: "get_user_tasks",
      params: { user_id: accountId || "", pointer: 0, n_tasks: 10 }
    },
    completed: {
      query: "get_user_completed_tasks",
      params: { user_id: accountId || "" }
    },
    incomplete: {
      query: "get_user_pending_tasks",
      params: { user_id: accountId || "" }
    },
    sorted: {
      query: "get_user_sorted_tasks",
      params: { user_id: accountId || "", pointer: 0, n_tasks: 10 }
    },
  };

  // Re-run the query whenever the selected filter or accountId changes
  const { result: tasks_data = [] } = useQuery<any>(
    queryMapping[filter].query,
    queryMapping[filter].params
  );

  // When tasks_data updates, update the local tasks state
  useEffect(() => {
    if (!tasksEqual(tasks_data, tasks)) {
      setTasks(tasks_data?.tasks);
    }
  }, [tasks_data]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!session) {
      router.push('/auth');
    }
  }, [session, router]);

  // NOTE: For a production app, you should call backend mutations
  // for toggling completion or deleting tasks instead of only updating local state.
  const toggleComplete = async (id: any) => {
    if (!tasks) return;
    if (!session) {
      alert("Please log in first");
      return;
    }
    // Call a backend mutation for toggling task completion here.
    try {
      await session.call({
        name: "complete_task",
        args: [id],
      });

      setTasks(tasks?.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const deleteTask = async (id: any) => {
    try {
      if (!session) {
        alert("Please log in first");
        return;
      }
      // Call a backend mutation for deleting a task here.
      await session.call({
        name: "delete_task",
        args: [id],
      });

      setTasks(tasks?.filter(task => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Start inline editing for a task by setting the edit state
  const startEditingTask = (task: any) => {
    setEditTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      due_date: task.due_date
    });
  };

  // Handle inline edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const cancelEdit = () => {
    setEditTaskId(null);
    setEditForm({ title: "", description: "", due_date: "" });
  };

  // Save the inline edit and call the backend update_task operation
  const saveEdit = async (id: any) => {
    if (!session) {
      alert("Please log in first");
      return;
    }
    try {
      const timestamp = new Date(editForm.due_date).getTime();
      await session.call({
        name: "update_task",
        args: [id, editForm.title, editForm.description, timestamp],
      });
      setTasks(tasks.map(task =>
        task.id === id
          ? { ...task, title: editForm.title, description: editForm.description, due_date: editForm.due_date }
          : task
      ));
      setEditTaskId(null);
      setEditForm({ title: "", description: "", due_date: "" });
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c28] text-[#f5f5f5] flex flex-col items-center py-10 px-5">
      <h1 className="text-4xl font-bold mb-5 text-[#007bff]">TaskFlow</h1>

      <div className="w-full max-w-md flex flex-col items-center gap-y-4 mb-5">
        <Button
          onClick={() => router.push('/new-task')}
          className="bg-[#007bff] hover:bg-[#0056b3] flex items-center gap-2"
        >
          <Plus size={20} /> Add Task
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setFilter("all")}
            className={`${filter === "all" ? "text-blue-500" : "text-gray-400"}`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFilter("completed")}
            className={`${filter === "completed" ? "text-green-500" : "text-gray-400"}`}
          >
            Completed
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFilter("incomplete")}
            className={`${filter === "incomplete" ? "text-yellow-500" : "text-gray-400"}`}
          >
            Incomplete
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFilter("sorted")}
            className={`${filter === "sorted" ? "text-purple-500" : "text-gray-400"} flex items-center gap-1`}
          >
            <Filter size={16} /> Due Date
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {tasks && tasks.map((task) => (
          <Card key={task.id} className="p-5 bg-[#28293e] border border-gray-700 rounded-lg shadow-lg">
            <CardContent className="flex flex-col gap-2">
              {editTaskId === task.id ? (
                // Inline editing form
                <>
                  <Input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="bg-[#3b3c4a] border-0 text-white"
                  />
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    className="bg-[#3b3c4a] border-0 text-white p-2 rounded"
                  />
                  <Input
                    type="date"
                    name="due_date"
                    value={editForm.due_date}
                    onChange={handleEditChange}
                    className="bg-[#3b3c4a] border-0 text-white"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => saveEdit(task.id)} className="bg-green-500 hover:bg-green-600">Save</Button>
                    <Button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600">Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {task.title}
                    </h2>
                    <div className="flex gap-2">
                      <CheckCircle
                        size={24}
                        className={`cursor-pointer ${task.completed ? 'text-green-500' : 'text-gray-500'}`}
                        onClick={() => toggleComplete(task.id)}
                      />
                      <Edit
                        size={24}
                        className="text-yellow-500 cursor-pointer"
                        onClick={() => startEditingTask(task)}
                      />
                      <Trash2
                        size={24}
                        className="text-red-500 cursor-pointer"
                        onClick={() => deleteTask(task.id)}
                      />
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{task.description}</p>
                  <p className="text-gray-400 text-xs text-end">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}