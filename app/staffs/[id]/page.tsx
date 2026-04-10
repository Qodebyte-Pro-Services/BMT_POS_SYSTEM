'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  Key, 
  Pencil, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { InventoryLayout } from '@/app/inventory/components/InventoryLayout';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Staff = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  role: string;
  role_id: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
};

type Role = {
  roles_id: string;
  role_name: string;
  permissions: string[];
  role_count: number;
};

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
    const [error, setError] = useState<string | null>(null);


  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
   const isSuperAdmin = staff?.role === "Super Admin";
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    role: '',
  });
  const [credentialForm, setCredentialForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [roles, setRoles] = useState<Role[]>([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };


   
const fetchRoles = async () => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${apiUrl}/roles?page=1&limit=100`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.status}`);
    }

    const data = await response.json();

   
    const transformedRoles: Role[] = data.roles.map((role: { 
      roles_id: string; 
      role_name: string; 
      permissions: string | string[]; 
      role_count?: number 
    }) => {
      let parsedPermissions: string[] = [];
      try {
        if (Array.isArray(role.permissions)) {
          parsedPermissions = role.permissions;
        } else if (typeof role.permissions === "string" && role.permissions.trim() !== "") {
          parsedPermissions = JSON.parse(role.permissions);
        }
      } catch (e) {
        console.error("Error parsing permissions for role:", role.role_name, e);
      }

      return {
        roles_id: role.roles_id,
        role_name: role.role_name,
        permissions: parsedPermissions,
        role_count: role.role_count || 0,
      };
    });

    setRoles(transformedRoles);
    setError(null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch roles";
    console.error("Error fetching roles:", err);
    setError(message);
    toast.error(message);
  }
};


useEffect(() => {
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/auth/${params.id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`,
        },
        credentials: "include", 
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch staff: ${res.status}`);
      }

      const data = await res.json();
      const admin = data.admin;

      if (!admin) {
        setStaff(null);
        setLoading(false);
        return;
      }

      
const mappedStaff: Staff = {
  id: admin.admin_id,
  full_name: admin.full_name ?? "",
  username: admin.username ?? "",
  email: admin.email ?? "",
  phone: admin.phone ?? "",
  address: admin.address ?? "",
  state: admin.state ?? "",
  role: admin.Role?.role_name ?? "No Role",
  role_id: admin.admin_role ?? "",
  status: admin.status === "active" ? "active" : "inactive",
  createdAt: admin.createdAt,
  lastLogin: admin.last_login ?? undefined,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(admin.full_name ?? "user")}`,
};

     

      const roleName = admin.Role?.role_name ?? '';

      setStaff(mappedStaff);
    setEditForm({
  full_name: mappedStaff.full_name ?? "",
  email: mappedStaff.email ?? "",
  phone: mappedStaff.phone ?? "",
  address: mappedStaff.address ?? "",
  state: mappedStaff.state ?? "",
  role: roleName,
});


      setCredentialForm({
        email: mappedStaff.email,
        password: "",
        confirmPassword: "",
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff(null);
      setLoading(false);
    }
  };

  fetchStaff();
  fetchRoles();
}, [params.id]);


  const handleEditSave = async () => {
  if (!staff) return;

  const selectedRole = roles.find(r => r.role_name === editForm.role);

  try {
    const res = await fetch(`${apiUrl}/auth/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        admin_id: staff.id,              
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        state: editForm.state,
        admin_role: selectedRole?.roles_id 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update staff");
    }

    const { admin } = await res.json();

    setStaff(prev =>
      prev
        ? {
            ...prev,
            full_name: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            address: admin.address,
            state: admin.state,
            role: admin.Role?.role_name ?? prev.role,
          }
        : prev
    );

    setIsEditDialogOpen(false);
    toast.success("Staff details updated successfully!");
  } catch (error: unknown) {
    console.error("Error updating staff:", error);
    toast.error(error instanceof Error ? error.message : "Update failed");
  }
};


  const handleCredentialSave = async () => {
  if (!staff) return;

  if (credentialForm.password !== credentialForm.confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/auth/credentials`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        admin_id: staff.id,          
        newPassword: credentialForm.password,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update password");
    }

    toast.success("Password updated successfully");
    setIsCredentialDialogOpen(false);
    setCredentialForm({ ...credentialForm, password: "", confirmPassword: "" });
  } catch (error: unknown) {
    console.error("Credential update error:", error);
    toast.error(error instanceof Error ? error.message : "Password update failed");
  }
};


  const getStatusBadge = (status: 'active' | 'inactive') => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return <Badge variant="destructive">{role}</Badge>;
      case 'Manager':
        return <Badge variant="default">{role}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <InventoryLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">Loading staff details...</div>
        </div>
      </InventoryLayout>
    );
  }

  if (!staff) {
    return (
      <InventoryLayout>
        <div className="p-6">
          <div className="text-center">Staff not found</div>
        </div>
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout>
      <div className="p-4 md:p-6 space-y-6 bg-white text-gray-900">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="link" className='text-gray-900' size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Staff Details</h1>
              <p className="text-sm text-gray-500">
                View and manage {staff.full_name}&apos;s information
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
         <Dialog
  open={!isSuperAdmin && isEditDialogOpen}
  onOpenChange={(open) => {
    if (isSuperAdmin) {
      toast.error("Super Admin details cannot be edited");
      return;
    }
    setIsEditDialogOpen(open);
  }}
>

              <DialogTrigger asChild>
           <Button
  variant="secondary"
  disabled={isSuperAdmin}
  onClick={() => setIsEditDialogOpen(true)}
>
  <Pencil className="w-4 h-4 mr-2" />
  Edit Details
</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-900">
                <DialogHeader>
                  <DialogTitle>Edit Staff Details</DialogTitle>
                  <DialogDescription>
                    Update staff personal information
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-fullName">Full Name</Label>
                      <Input
                        id="edit-fullName"
                        value={editForm.full_name || ""}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      />
                    </div>
                    
              
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email Address</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone || ""}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Input
                        id="edit-address"
                        value={editForm.address || ""}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        value={editForm.state || ""}
                        onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select value={editForm.role || ""} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.roles_id} value={role.role_name}>{role.role_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSave} className="bg-gray-100 hover:bg-gray-200 text-gray-900">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
           <Dialog
  open={!isSuperAdmin && isCredentialDialogOpen}
  onOpenChange={(open) => {
    if (isSuperAdmin) {
      toast.error("Super Admin credentials cannot be updated");
      return;
    }
    setIsCredentialDialogOpen(open);
  }}
>

              <DialogTrigger asChild>
               <Button
  className="bg-gray-900 hover:bg-gray-800 text-white"
  disabled={isSuperAdmin}
  onClick={() => setIsCredentialDialogOpen(true)}
>
  <Key className="w-4 h-4 mr-2" />
  Update Credentials
</Button>

              </DialogTrigger>
              <DialogContent className="max-w-md bg-gray-900">
                <DialogHeader>
                  <DialogTitle>Update Login Credentials</DialogTitle>
                  <DialogDescription>
                    Change staff email and password
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <Alert className="bg-yellow-50 border-green-200">
                    <AlertDescription className="text-green-800 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Staff will need to use new credentials for next login
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cred-email">Email Address</Label>
                  <Input
                      id="cred-email"
                      type="email"
                      value={credentialForm.email || ""}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cred-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="cred-password"
                        type={showPassword ? "text" : "password"}
                        value={credentialForm.password}
                        onChange={(e) => setCredentialForm({...credentialForm, password: e.target.value})}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Password must be at least 8 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cred-confirm">Confirm New Password</Label>
                    <Input
                      id="cred-confirm"
                      type={showPassword ? "text" : "password"}
                      value={credentialForm.confirmPassword}
                      onChange={(e) => setCredentialForm({...credentialForm, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCredentialDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCredentialSave} className="bg-gray-100 hover:bg-gray-200 text-gray-800">
                    <Key className="w-4 h-4 mr-2" />
                    Update Credentials
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

       
        <div className="grid grid-cols-1  xl:grid-cols-3 gap-6">

          <div className="lg:col-span-1">
            <Card className="border border-gray-200 bg-gray-100  text-gray-900">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4">
                    
                    <AvatarFallback className="text-2xl">
                      {staff.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold">{staff.full_name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(staff.role)}
                    {/* {getStatusBadge(staff.status)} */}
                  </div>
                  
                  <div className="mt-6 space-y-4 w-full">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Username</p>
                        <p className="text-sm text-gray-600 font-mono">{staff.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{staff.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{staff.phone || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-gray-600">{staff.state || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
 
            <Card className="border border-gray-200 bg-gray-100 text-gray-900 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Joined Date</span>
                    </div>
                    <span className="text-sm font-medium">
                      {format(new Date(staff.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Last Login</span>
                    </div>
                    <span className="text-sm font-medium">
                      {staff.lastLogin ? format(new Date(staff.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          <div className="lg:col-span-2">
            <Card className="border border-gray-200 bg-gray-100 text-gray-900">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Detailed information about the staff member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Full Name</Label>
                      <p className="font-medium">{staff.full_name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Email Address</Label>
                      <p className="font-medium">{staff.email}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Phone Number</Label>
                      <p className="font-medium">{staff.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Username</Label>
                      <p className="font-medium text-gray-900 font-mono">{staff.username || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Address</Label>
                      <p className="font-medium">{staff.address || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">State</Label>
                      <p className="font-medium">{staff.state || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Role</Label>
                      <div className="mt-1">{getRoleBadge(staff.role)}</div>
                    </div>
                    
                    {/* <div>
                      <Label className="text-sm text-gray-500">Account Status</Label>
                      <div className="mt-1">{getStatusBadge(staff.status)}</div>
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="border border-gray-200 bg-gray-100 text-gray-900 mt-6">
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  Permissions assigned to {staff.role} role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 text-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Assigned Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {roles
                        .find(r => r.roles_id === staff.role_id)
                        ?.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="bg-white text-gray-900">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  
                  <Alert className="bg-yellow-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Permissions are managed through the role. To change permissions, edit the role in Settings.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

         
            <Card className="border border-gray-200 bg-gray-100 text-gray-900 mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Button
  variant="secondary"
  disabled={isSuperAdmin}
  onClick={() => setIsEditDialogOpen(true)}
  className="h-auto py-4 flex flex-col items-center justify-center"
>
  <Pencil className="w-6 h-6 mb-2" />
  <span>Edit Details</span>
  {isSuperAdmin && (
    <span className="text-xs text-red-500 mt-1">Restricted</span>
  )}
</Button>

                  
                 <Button
  variant="secondary"
  disabled={isSuperAdmin}
  onClick={() => setIsCredentialDialogOpen(true)}
  className="h-auto py-4 flex flex-col items-center justify-center"
>
  <Key className="w-6 h-6 mb-2" />
  <span>Update Credentials</span>
  {isSuperAdmin && (
    <span className="text-xs text-red-500 mt-1">Restricted</span>
  )}
</Button>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </InventoryLayout>
  );
}