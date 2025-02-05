'use client';

import { useSessionContext } from '@/components/ContextProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const page = () => {
  const session = useSessionContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [task, setTask] = useState({
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0], // Default to today
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      alert("Please log in first");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating task...");

      const dueDateTimestamp = new Date(task.due_date).getTime();

      await session.call({
        name: "create_task",
        args: [task.title, task.description, dueDateTimestamp],
      });

      router.push("/");
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c28] text-[#f5f5f5] flex flex-col items-center py-10 px-5">
      <h1 className="text-4xl font-bold mb-5 text-[#007bff]">Add Task</h1>
      <Card className="w-full max-w-md p-6 bg-[#28293e] border border-gray-700 rounded-lg shadow-lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              className="bg-[#3b3c4a] border-0 text-white"
              name="title"
              placeholder="Task Title"
              value={task.title}
              onChange={handleChange}
              required
            />
            <Textarea
              className="bg-[#3b3c4a] border-0 text-white"
              name="description"
              placeholder="Task Description"
              value={task.description}
              onChange={handleChange}
              required
            />
            <Input
              type="date"
              className="bg-[#3b3c4a] border-0 text-white"
              name="due_date"
              value={task.due_date}
              onChange={handleChange}
              required
            />
            <Button className="w-full bg-[#007bff] hover:bg-[#0056b3] flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? <Loader className="animate-spin" size={20} /> : "Create Task"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default page