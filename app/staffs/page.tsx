
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Eye, Trash2, Mail, Phone, MapPin, Key, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { InventoryLayout } from '../inventory/components/InventoryLayout';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePageGuard } from '../hooks/usePageGuard';

type Staff = {
   admin_id: string;
  full_name: string;
  admin_role: string;
  email: string;
  username: string | null;
  phone: string | null;
  isVerified: boolean;
  status: string | null;
  address: string | null;
  state: string | null;
  last_login: string;
  login_success_count: number;
  twoFa_enabled: boolean;
  createdAt: string;
  updatedAt: string;
  Role: {
    roles_id: string;
    role_name: string;
    permissions: string[];
  };
};

type Role = {
  roles_id: string;
  role_name: string;
  permissions: string[];
  role_count: number;
};

export default function StaffPage() {
   usePageGuard();
  const router = useRouter();
  const [staffs, setStaffs] = useState<Staff[]>([]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const ITEMS_PER_PAGE = 5;
  const [totalStaffs, setTotalStaffs] = useState(0);
  const [kpiLoading, setKpiLoading] = useState(false);

const [currentPage, setCurrentPage] = useState(1);

const totalPages = Math.ceil(staffs.length / ITEMS_PER_PAGE);

const paginatedStaffs = staffs.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };


   const fetchStaffs = async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${apiUrl}/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staffs: ${response.status}`);
      }

      const data = await response.json();
      

      const transformedStaffs = data.admins.map((admin: Staff) => ({
        admin_id: admin.admin_id,
        full_name: admin.full_name,
        username: admin.username,
        email: admin.email,
        phone: admin.phone || 'N/A',
        address: admin.address || 'N/A',
        state: admin.state || 'N/A',
        Role: admin.Role || [],
        createdAt: new Date(admin.createdAt).toLocaleDateString('en-US'),
        lastLogin: admin.last_login 
          ? new Date(admin.last_login).toLocaleString('en-US')
          : 'Never',
      }));
      toast.success('Staff data fetched successfully');
      setStaffs(transformedStaffs);
      setTotalStaffs(transformedStaffs.length);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch staffs';
      console.error('Error fetching staffs:', err);
      setError(message);
        toast.error(message);
    }
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

   
    const transformedRoles: Role[] = data.roles.map((role: Role) => ({
      roles_id: role.roles_id,
      role_name: role.role_name,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      role_count: role.role_count || 0,
    }));

    setRoles(transformedRoles);
    setError(null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch roles";
    console.error("Error fetching roles:", err);
    setError(message);
    toast.error(message);
  }
};


  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    full_name: '',  
    email: '',
    phone: '',
    address: '',
    state: '',
    role: '',
    generatePassword: true,
    customPassword: '',
    sendCredentials: true,
  });

  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

 
  const generateUsername = (firstName: string, lastName: string) => {
    const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
    
  
    while (staffs.some(staff => staff.username === username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  };

const handleInputChange = (field: string, value: string) => {
  setNewStaff(prev => ({ ...prev, [field]: value }));
  
  
  if (field === 'full_name' && value.trim()) {
    const nameParts = value.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1] || '';
    const username = generateUsername(firstName, lastName);
    setGeneratedUsername(username);
  }
};
 
 const handleAddStaff = async () => {
  const token = getAuthToken();
  if (!token) return toast.error("No auth token found.");

  try {
    // Generate password if needed
    const finalPassword = newStaff.generatePassword 
      ? (generatedPassword || generateRandomPassword()) 
      : newStaff.customPassword;

    if (!finalPassword) {
      return toast.error("Please provide or generate a password");
    }

    const roleObj = roles.find(r => r.role_name === newStaff.role);
    if (!roleObj) return toast.error("Please select a valid role");

    const payload = {
      full_name: newStaff.full_name,
      email: newStaff.email,
      admin_role: roleObj.roles_id,
      phone: newStaff.phone,
      address: newStaff.address,
      state: newStaff.state,
      username: generatedUsername,
      password: finalPassword,
    };

    const response = await fetch(`${apiUrl}/auth/add-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add staff");
    }

    toast.success("Staff added successfully!");
   setStaffs(prev => [
  ...prev,
  {
    admin_id: data.admin_id || `temp-${Date.now()}`, 
    full_name: newStaff.full_name,
    admin_role: roleObj.roles_id,
    email: newStaff.email,
    username: generatedUsername,
    phone: newStaff.phone || null,
    isVerified: false,
    status: null,
    address: newStaff.address || null,
    state: newStaff.state || null,
    last_login: "Never",
    login_success_count: 0,
    twoFa_enabled: false,
    createdAt: new Date().toLocaleDateString("en-US"),
    updatedAt: new Date().toLocaleDateString("en-US"),
    Role: roleObj,
  },
]);


   
    setNewStaff({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      role: "",
      generatePassword: true,
      customPassword: "",
      sendCredentials: true,
    });
    setGeneratedUsername("");
    setGeneratedPassword("");
    setIsAddDialogOpen(false);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add staff";
    console.error(err);
    toast.error(message);
  }
};


 
 const handleDeleteStaff = async (id: string) => {
  const token = getAuthToken();
  if (!token) return toast.error("No auth token found.");

  if (!confirm("Are you sure you want to delete this staff member?")) return;

  try {
    const response = await fetch(`${apiUrl}/auth/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete staff");
    }

    toast.success("Staff deleted successfully!");
    setStaffs(prev => prev.filter(staff => staff.admin_id !== id));

  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete staff";
    console.error(err);
    toast.error(message);
  }
};



  const handleViewStaff = (id: string) => {
    router.push(`/staffs/${id}`);
  };


  const copyToClipboard = (text: string, type: 'username' | 'password') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'username') {
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
    });
  };


  const fetchStaffKPI = async () => {
    setKpiLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const response = await fetch(`${apiUrl}/analytics/admin-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch staff KPI');

      const data = await response.json();
      if (data.success) {
        setTotalStaffs(data.admin_count.total_admins);
      }
    } catch (err) {
      console.error('Error fetching staff KPI:', err);
      setTotalStaffs(staffs.length);
    } finally {
      setKpiLoading(false);
    }
  };

 
useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStaffs(),
        fetchRoles(),
        fetchStaffKPI(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);




 
  useEffect(() => {
    if (staffs.length > 0) {
      setTotalStaffs(staffs.length);
    }
  }, [staffs]);
 


  return (
    <InventoryLayout>
      <div className="p-4 md:p-6 space-y-6 bg-white text-gray-900">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-sm text-gray-500">Manage your staff members and their roles</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Enter staff details and set up their login credentials
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={newStaff.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@business.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newStaff.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newStaff.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Business Street"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newStaff.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Lagos"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                  </Label>
                 <Select value={newStaff.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
  {roles.map((role) => (
    <SelectItem key={role.roles_id} value={role.role_name}>
      {role.role_name}
    </SelectItem>
  ))}
                </SelectContent>
              </Select>

                  
                  {newStaff.role && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium mb-1">Role Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                      {roles
  .find(r => r.role_name === newStaff.role)
  ?.permissions.map((perm, idx) => (
    <Badge key={`${perm}-${idx}`} variant="outline" className="text-xs">
      {perm}
    </Badge>
))}


                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
         
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Login Credentials</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <div className="flex gap-2">
                        <Input
                          value={generatedUsername}
                          readOnly
                          className="bg-gray-50"
                          placeholder="Will be auto-generated"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(generatedUsername, 'username')}
                          disabled={!generatedUsername}
                        >
                          {copiedUsername ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Auto-generated from first and last name
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="generate-password"
                            checked={newStaff.generatePassword}
                            onChange={() => {
                              setNewStaff({...newStaff, generatePassword: true, customPassword: ''});
                              setGeneratedPassword(generateRandomPassword());
                            }}
                            className="rounded-full"
                          />
                          <Label htmlFor="generate-password" className="text-sm">
                            Generate random password
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="custom-password"
                            checked={!newStaff.generatePassword}
                            onChange={() => setNewStaff({...newStaff, generatePassword: false})}
                            className="rounded-full"
                          />
                          <Label htmlFor="custom-password" className="text-sm">
                            Set custom password
                          </Label>
                        </div>
                        
                        {newStaff.generatePassword ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={generatedPassword}
                              readOnly
                              className="bg-gray-50 font-mono"
                              type="password"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(generatedPassword, 'password')}
                              disabled={!generatedPassword}
                            >
                              {copiedPassword ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="password"
                            value={newStaff.customPassword}
                            onChange={(e) => handleInputChange('customPassword', e.target.value)}
                            placeholder="Enter custom password"
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-credentials"
                      checked={newStaff.sendCredentials}
                      onChange={(e) => setNewStaff({...newStaff, sendCredentials: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="send-credentials" className="text-sm">
                      Send login credentials to staff email
                    </Label>
                  </div>
                  
                  {newStaff.sendCredentials && (
                    <Alert className="bg-yellow-50 border-green-200">
                      <AlertDescription className="text-green-800 text-sm">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        An email with login credentials will be sent to {newStaff.email || 'the staff email'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setNewStaff({
                      full_name: '',
                      email: '',
                      phone: '',
                      address: '',
                      state: '',
                      role: '',
                      generatePassword: true,
                      customPassword: '',
                      sendCredentials: true,
                    });
                    setGeneratedUsername('');
                    setGeneratedPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddStaff}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  Add Staff Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <KPICard
            title="Total Staff"
            value={kpiLoading ? 'Loading...' : totalStaffs.toString()}
            icon={<Users className="w-5 h-5" />}
            description="All staff members"
          />
        </div>

  
        <Card className="border border-gray-200 bg-gray-900">
          <CardHeader>
            <CardTitle>Staff List ({staffs.length} members)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaffs.map((staff) => (
                    <TableRow key={staff.admin_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {staff.full_name.split(' ')[0]?.[0]}{staff.full_name.split(' ')[1]?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff.full_name}</p>
                            <p className="text-sm text-gray-500">{staff.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {staff.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {staff.phone || 'Not set'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{staff.address || 'Not set'}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {staff.state || 'Not set'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          staff.Role?.role_name === 'Administrator' ? 'default' : 
                          staff.Role?.role_name === 'Manager' ? 'secondary' : 'outline'
                        }>
                          {staff.Role?.role_name || 'No Role'}
                        </Badge>
                      </TableCell>
                     
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStaff(staff.admin_id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.admin_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={staff.Role?.role_name === 'Administrator'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="sm:flex sm:items-center sm:justify-between grid grid-cols-1 gap-2 mt-4 px-2">
  <p className="text-sm text-gray-400">
    Page {currentPage} of {totalPages}
  </p>

  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
    >
      Previous
    </Button>

    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
    >
      Next
    </Button>
  </div>
</div>

            </div>
          </CardContent>
        </Card>
      </div>
    </InventoryLayout>
  );
}


function KPICard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="border border-gray-200 bg-gray-100 text-gray-900 shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-green-500">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}