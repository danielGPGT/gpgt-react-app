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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "@/components/ui/user-table";
import { Inventory } from "@/components/ui/inventory";
import { useTheme } from "@/components/theme-provider";
import { BookingsChart } from "@/components/ui/bookingsChart";
import FxTable from "./fxTable";
import { ApiKeysTable } from "./apiKeysTable";

function AdminDashboard() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get("/users");
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 w-full">

      <Tabs defaultValue="overview" className="">
        <TabsList className="flex flex-wrap gap-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="fx">FX Rates</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-2">
          <BookingsChart />
        </TabsContent>

        <TabsContent value="users" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Users Management</CardTitle>
              <CardDescription className="text-muted-foreground">
                View, edit and add more users to collaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Sales Management</CardTitle>
              <CardDescription className="text-muted-foreground">
                Monitor and manage sales activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Sales dashboard content coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Operations Management</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track and manage operational activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operations content will go here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fx" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">FX Rates Table</CardTitle>
              <CardDescription className="text-muted-foreground">
                View and manage current foreign exchange rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <FxTable />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">API Keys Management</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create and manage API keys for external applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ApiKeysTable />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AdminDashboard };
