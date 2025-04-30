'use client';

import { useEffect, useState } from 'react';
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";

const roles = [
  "Admin",
  "Internal Sales",
  "Operations",
  "External B2B",
];

function UsersTable() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; // 🔥 How many users per page

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
    fetchUsers();
  }, []);

  function handleEditClick(user) {
    setEditingUserId(user.user_id);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      company: user.company,
    });
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRoleChange(value) {
    setEditFormData((prev) => ({
      ...prev,
      role: value,
    }));
  }

  async function handleSaveClick(userId) {
    try {
      await api.put(`/users/${userId}`, editFormData);
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId ? { ...user, ...editFormData } : user
        )
      );
      setEditingUserId(null);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  function handleCancelClick() {
    setEditingUserId(null);
    setEditFormData({});
  }

  async function handleDeleteUser(userId) {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic 🔥
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  function handleNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter emails..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-1/3 bg-background"
        />
        <Button variant="outline" className="bg-background">Columns</Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Role</TableHead>
              <TableHead className="text-foreground">Company</TableHead>
              <TableHead className="text-foreground">Login Count</TableHead>
              <TableHead className="text-foreground">Last Login</TableHead>
              <TableHead className="text-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow key={user.user_id}>
                  {editingUserId === user.user_id ? (
                    <>
                      <TableCell>
                        <div className="flex gap-2">
                          <Input
                            name="first_name"
                            value={editFormData.first_name}
                            onChange={handleInputChange}
                            placeholder="First Name"
                            className="bg-background"
                          />
                          <Input
                            name="last_name"
                            value={editFormData.last_name}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                            className="bg-background"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          name="email"
                          value={editFormData.email}
                          onChange={handleInputChange}
                          placeholder="Email"
                          className="bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={editFormData.role} onValueChange={handleRoleChange}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          name="company"
                          value={editFormData.company}
                          onChange={handleInputChange}
                          placeholder="Company"
                          className="bg-background"
                        />
                      </TableCell>
                      <TableCell className="text-foreground">{user.login_count}</TableCell>
                      <TableCell className="text-foreground">{user.last_login}</TableCell>
                      <TableCell className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleSaveClick(user.user_id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelClick} className="bg-background">
                          Cancel
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-foreground">{user.first_name} {user.last_name}</TableCell>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell className="text-foreground">{user.role}</TableCell>
                      <TableCell className="text-foreground">{user.company}</TableCell>
                      <TableCell className="text-foreground">{user.login_count}</TableCell>
                      <TableCell className="text-foreground">{user.last_login}</TableCell>
                      <TableCell className="w-0 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4 text-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuLabel className="text-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditClick(user)} className="text-foreground">
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert(JSON.stringify(user, null, 2))} className="text-foreground">
                              View User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.user_id)} className="text-destructive">
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-sm text-muted-foreground p-2">
        <div>
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="bg-background"
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="bg-background"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export { UsersTable };
