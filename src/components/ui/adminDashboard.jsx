import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { UsersTable } from "@/components/ui/user-table";

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get("/users"); // Adjust API endpoint if needed
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  return (
    <Card className="w-full bg-neutral-50">
      <CardHeader>
        <h2 className="text-lg font-bold">Users</h2>
        <p className="text-sm text-muted-foreground">
          View, edit and add more users to collaborate
        </p>
      </CardHeader>

      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
export { AdminDashboard };
