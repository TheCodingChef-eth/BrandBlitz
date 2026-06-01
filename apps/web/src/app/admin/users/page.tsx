"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  status: "active" | "suspended";
  suspensionReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type StatusFilter = "all" | "active" | "suspended";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "suspended") return "destructive";
  return "default";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const apiToken = (session as { apiToken?: string } | null)?.apiToken;
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("suspended");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Suspend dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"suspend" | "unsuspend">("suspend");
  const [dialogUserId, setDialogUserId] = useState("");
  const [dialogUserName, setDialogUserName] = useState("");
  const [dialogReason, setDialogReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated" && userRole !== "admin") {
      router.push("/dashboard");
    }
  }, [authStatus, userRole, router]);

  // ─── Data loading ────────────────────────────────────────────────────────

  const loadUsers = useCallback(
    async (page = 1) => {
      if (!apiToken) return;
      setLoading(true);
      try {
        const api = createApiClient(apiToken);
        const params: Record<string, string | number> = { page, pageSize: 20 };
        if (statusFilter !== "all") params.status = statusFilter;
        if (search.trim()) params.search = search.trim();

        const res = await api.get("/admin/users", { params });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [apiToken, statusFilter, search],
  );

  useEffect(() => {
    if (authStatus === "authenticated" && userRole === "admin") {
      void loadUsers(1);
    }
  }, [loadUsers, authStatus, userRole]);

  // ─── Search handler ──────────────────────────────────────────────────────

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  // ─── Dialog helpers ──────────────────────────────────────────────────────

  function openSuspendDialog(user: AdminUser) {
    setDialogMode("suspend");
    setDialogUserId(user.id);
    setDialogUserName(user.displayName || user.email);
    setDialogReason("");
    setDialogOpen(true);
  }

  function openUnsuspendDialog(user: AdminUser) {
    setDialogMode("unsuspend");
    setDialogUserId(user.id);
    setDialogUserName(user.displayName || user.email);
    setDialogReason("");
    setDialogOpen(true);
  }

  async function handleSubmitAction() {
    if (!apiToken) return;
    if (dialogMode === "suspend" && !dialogReason.trim()) return;

    setSubmitting(true);
    const api = createApiClient(apiToken);

    try {
      if (dialogMode === "suspend") {
        await api.patch(`/admin/users/${dialogUserId}/suspend`, {
          reason: dialogReason.trim(),
        });
      } else {
        await api.patch(`/admin/users/${dialogUserId}/unsuspend`);
      }
      setDialogOpen(false);
      await loadUsers(pagination.page);
    } catch {
      // Toast is handled by the API interceptor
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (authStatus === "loading" || (authStatus === "authenticated" && userRole !== "admin")) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <span className="text-sm text-gray-500">{pagination.total} users</span>
      </div>

      {/* Filter & search bar */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">Status:</Label>
            {(["all", "active", "suspended"] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}

            <div className="ml-auto" />

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search name, email, or username…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64"
              />
              <Button type="submit" size="sm" variant="outline">
                Search
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Suspended at</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {user.username ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <span
                          className="truncate text-xs text-gray-600 block"
                          title={user.suspensionReason ?? undefined}
                        >
                          {user.suspensionReason ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {user.suspendedAt
                          ? new Date(user.suspendedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.status === "active" && user.role !== "admin" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openSuspendDialog(user)}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openUnsuspendDialog(user)}
                          >
                            Unsuspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => void loadUsers(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => void loadUsers(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Suspend / Unsuspend dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "suspend" ? "Suspend" : "Unsuspend"} user
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              {dialogMode === "suspend"
                ? `Suspending "${dialogUserName}" will block them from entering paid challenges. They will retain read-only access.`
                : `Unsuspending "${dialogUserName}" will restore full access.`}
            </p>
            {dialogMode === "suspend" && (
              <>
                <Label htmlFor="suspend-reason">
                  Suspension reason <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="suspend-reason"
                  placeholder="e.g. Suspected multi-accounting"
                  value={dialogReason}
                  onChange={(e) => setDialogReason(e.target.value)}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant={dialogMode === "suspend" ? "destructive" : "default"}
              onClick={handleSubmitAction}
              disabled={
                submitting ||
                (dialogMode === "suspend" && !dialogReason.trim())
              }
            >
              {submitting
                ? "Saving…"
                : dialogMode === "suspend"
                  ? "Suspend user"
                  : "Unsuspend user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
