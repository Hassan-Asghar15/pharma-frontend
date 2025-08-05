'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  // Sort by newest first for consistent display
  return res.data.sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// --- Helper for Role Badge Variant ---
const getRoleBadgeVariant = (role: User['role']): BadgeVariant => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'company': return 'default';
      case 'distributor': return 'secondary';
      case 'shopkeeper': return 'outline';
      default: return 'outline';
    }
};

// ==========================================================
// Mobile-Optimized User Card Component
// ==========================================================
const UserCard = ({ user, onToggleStatus, onDeleteClick }: { user: User; onToggleStatus: (user: User) => void; onDeleteClick: (user: User) => void; }) => (
  <Card className="mb-4">
    <CardHeader className="p-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <CardTitle className="text-base">{user.name}</CardTitle>
          <CardDescription className="text-xs break-all">{user.email}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" disabled={user.role === 'admin'} onClick={() => onDeleteClick(user)}>
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="p-4 text-sm space-y-3 border-t">
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Role:</span>
        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Joined:</span>
        <span>{format(new Date(user.createdAt), 'dd MMM yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Active Status:</span>
        <Switch
          checked={user.isActive}
          onCheckedChange={() => onToggleStatus(user)}
          disabled={user.role === 'admin'}
          aria-label={`Toggle status for ${user.name}`}
        />
      </div>
    </CardContent>
  </Card>
);

// ==========================================================
// Main Manage Users Page Component
// ==========================================================
export default function ManageUsersPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  // Safely determine screen size on the client
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const swrKey = token ? [`${apiUrl}/api/admin/users`, token] : null;
  const { data: users, error, isLoading, mutate } = useSWR<User[]>(swrKey, fetcher);

  const handleToggleStatus = async (userToToggle: User) => {
    if (!token) return toast.error("Authentication error.");

    const originalUsers = users;
    const actionMessage = userToToggle.isActive ? 'deactivated' : 'activated';

    // Optimistic UI update
    mutate(users?.map(u => u._id === userToToggle._id ? { ...u, isActive: !u.isActive } : u), false);

    try {
      await axios.put(`${apiUrl}/api/admin/users/${userToToggle._id}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`User '${userToToggle.name}' has been ${actionMessage}.`);
    } catch (err) {
      toast.error("Failed to update user status.");
      // Revert on error
      if (originalUsers) mutate(originalUsers, false);
    } finally {
      // Revalidate to sync with server
      await mutate();
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !token) return;

    const promise = axios.delete(`${apiUrl}/api/admin/users/${userToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: () => {
        mutate(); // Re-fetch list
        setUserToDelete(null); // Close dialog
        return `User '${userToDelete.name}' has been deleted.`;
      },
      error: (err: AxiosError<{ message: string }>) => {
        return err.response?.data?.message || "Failed to delete user.";
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Failed to load user data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h2>

      {(!users || users.length === 0) ? (
        <div className="text-center h-24 text-gray-500">No users found.</div>
      ) : isMobile ? (
        // --- Mobile View: List of Cards ---
        <div>
          {users.map((user) => (
            <UserCard 
              key={user._id} 
              user={user} 
              onToggleStatus={handleToggleStatus} 
              onDeleteClick={setUserToDelete} 
            />
          ))}
        </div>
      ) : (
        // --- Desktop View: Table ---
        <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-x-auto">
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
              {users.map((user) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-red-500" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong className="text-gray-800 dark:text-gray-100">{userToDelete?.name}</strong>. This action cannot be undone.
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