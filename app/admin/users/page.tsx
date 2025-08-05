'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Type Definitions ---
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'company' | 'distributor' | 'shopkeeper';
  isActive: boolean;
  createdAt: string;
}
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// --- SWR Fetcher Function ---
const fetcher = async ([url, token]: [string, string | null]): Promise<User[]> => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export default function ManageUsersPage() {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const swrKey = isClient && token ? [`${apiUrl}/api/admin/users`, token] : null;
  const { data: users, error, isLoading, mutate } = useSWR<User[]>(swrKey, fetcher);

 const handleToggleStatus = async (userToToggle: User) => {
  if (!token) return toast.error("Authentication error.");

  const actionMessage = userToToggle.isActive ? 'deactivated' : 'activated';

  try {
    // 🧠 Optimistic UI update
    mutate(
      currentUsers => {
        if (!currentUsers) return [];
        return currentUsers.map(u =>
          u._id === userToToggle._id ? { ...u, isActive: !u.isActive } : u
        );
      },
      false // Don't revalidate yet
    );

    await axios.put(`${apiUrl}/api/admin/users/${userToToggle._id}/status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Revalidate to confirm latest data
    await mutate();

    toast.success(`User '${userToToggle.name}' has been ${actionMessage}.`);
  } catch (err) {
    toast.error("Failed to update user status.");
  }
};

  const handleDeleteUser = async () => {
    if (!userToDelete || !token) return;

    try {
      await axios.delete(`${apiUrl}/api/admin/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await mutate(); // Refresh user list
      toast.success(`User '${userToDelete.name}' has been deleted.`);
      setUserToDelete(null);
    } catch (err) {
      toast.error("Failed to delete user.");
    }
  };

  const getRoleBadgeVariant = (role: User['role']): BadgeVariant => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'company': return 'default';
      case 'distributor': return 'secondary';
      case 'shopkeeper': return 'outline';
      default: return 'outline';
    }
  };

  if (!isClient || isLoading) {
    return <div className="flex justify-center items-center h-full">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Failed to load user data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>{format(new Date(user.createdAt), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={user.isActive}
                    onCheckedChange={() => handleToggleStatus(user)}
                    disabled={user.role === 'admin'}
                    aria-label={`Toggle status for ${user.name}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={user.role === 'admin'}
                    onClick={() => setUserToDelete(user)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-red-500" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{userToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
