import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path as needed

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { UserService, User, UpdateUserRequest, UserStatus, ERole } from '../services/user.service'; // Import UserService and User type

export default function UserProfiles() {
  const { user, isAuthenticated, logout } = useAuth(); // Add logout from auth context
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    roles: [] as string[]
  });

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Inject custom styles
  useEffect(() => {
    const modernStyles = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6, #1d4ed8);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #1d4ed8, #1e40af);
      }
      .floating-card {
        background: linear-gradient(145deg, #ffffff, #f8fafc);
        box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
      }
      .dark .floating-card {
        background: linear-gradient(145deg, #1f2937, #111827);
        box-shadow: 20px 20px 60px #0f172a, -20px -20px 60px #374151;
      }
      .profile-gradient {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(2deg); }
      }
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.5s ease-out;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use UserService instead of manual fetch
        const userData = await UserService.getUserById(user.id);
        setUserDetails(userData);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user?.id, isAuthenticated]);

  // Refresh function for error retry
  const handleRefresh = () => {
    if (user?.id) {
      const fetchUserDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          const userData = await UserService.getUserById(user.id);
          setUserDetails(userData);
        } catch (err) {
          console.error('Error fetching user details:', err);
          setError(err instanceof Error ? err.message : 'Failed to load user details');
        } finally {
          setLoading(false);
        }
      };
      fetchUserDetails();
    }
  };

  // Edit modal handlers
  const handleEditProfile = () => {
    if (userDetails) {
      setEditForm({
        username: userDetails.username,
        email: userDetails.email,
        password: '',
        roles: userDetails.roles.map(role => role.name)
      });
      setShowEditModal(true);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditForm({
      username: '',
      email: '',
      password: '',
      roles: []
    });
  };

  const handleUpdateProfile = async () => {
    if (!userDetails) return;

    setIsUpdating(true);

    try {
      // Validate form
      const validation = UserService.validateUserData(editForm);
      if (!validation.valid) {
        alert(`Please fix the following issues:\n${validation.errors.join('\n')}`);
        return;
      }

      // Update user
      const updatedUser = await UserService.updateUser(userDetails.id, editForm);
      setUserDetails(updatedUser);
      setShowEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Export data as PDF
  const handleExportData = async () => {
    if (!userDetails) return;

    setIsExporting(true);

    try {
      // Create a comprehensive data export as JSON and HTML
      const exportData = {
        userProfile: {
          id: userDetails.id,
          username: userDetails.username,
          email: userDetails.email,
          status: UserService.getStatusDisplayName(userDetails.status as any),
          roles: userDetails.roles.map(role => ({
            name: role.name,
            displayName: UserService.getRoleDisplayName(role.name as any)
          })),
          permissionLevel: UserService.isAdmin(userDetails) ? 'Full Access (Administrator)' : 
                          UserService.isModerator(userDetails) ? 'Limited Access (Moderator)' : 'Basic Access (User)',
          accountCreated: UserService.formatDate(userDetails.createdAt),
          lastUpdated: UserService.formatDate(userDetails.updatedAt),
          accountAge: Math.floor((new Date().getTime() - new Date(userDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          exportDate: new Date().toLocaleString()
        }
      };

      // Create HTML content for better PDF generation
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>User Profile Export - ${userDetails.username}</title>
          <style>
            @page {
              margin: 1in;
              size: letter;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1a202c;
              font-size: 14px;
              margin: 0;
              padding: 0;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 2rem;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 2rem;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header h1 {
              margin: 0 0 0.5rem 0;
              font-size: 2rem;
              font-weight: bold;
            }
            .header p {
              margin: 0;
              opacity: 0.9;
            }
            .section {
              background: #f7fafc;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #4c51bf;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 0.5rem;
              margin: 0 0 1rem 0;
              font-size: 1.25rem;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.75rem 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #2d3748;
              flex: 0 0 40%;
            }
            .value {
              color: #4a5568;
              flex: 1;
              text-align: right;
              word-break: break-word;
            }
            .roles {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              justify-content: flex-end;
            }
            .role-badge {
              background: #edf2f7;
              color: #2d3748;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 500;
              border: 1px solid #cbd5e0;
            }
            .footer {
              text-align: center;
              color: #718096;
              font-size: 0.75rem;
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            .json-data {
              background: #f1f5f9;
              border: 1px solid #cbd5e0;
              border-radius: 6px;
              padding: 1rem;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              white-space: pre-wrap;
              word-break: break-all;
              margin-top: 1rem;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .section { break-inside: avoid; }
              .header { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>User Profile Export</h1>
            <p>Account data for ${userDetails.username}</p>
            <p style="font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Account Information</h2>
            <div class="info-row">
              <div class="label">User ID:</div>
              <div class="value">${userDetails.id}</div>
            </div>
            <div class="info-row">
              <div class="label">Username:</div>
              <div class="value">${userDetails.username}</div>
            </div>
            <div class="info-row">
              <div class="label">Email Address:</div>
              <div class="value">${userDetails.email}</div>
            </div>
            <div class="info-row">
              <div class="label">Account Status:</div>
              <div class="value">${UserService.getStatusDisplayName(userDetails.status as any)}</div>
            </div>
          </div>

          <div class="section">
            <h2>Roles & Permissions</h2>
            <div class="info-row">
              <div class="label">Assigned Roles:</div>
              <div class="value">
                <div class="roles">
                  ${userDetails.roles.map(role => 
                    `<span class="role-badge">${UserService.getRoleDisplayName(role.name as any)}</span>`
                  ).join('')}
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="label">Permission Level:</div>
              <div class="value">
                ${UserService.isAdmin(userDetails) ? 'Full Access (Administrator)' : 
                  UserService.isModerator(userDetails) ? 'Limited Access (Moderator)' : 'Basic Access (User)'}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Account Timeline</h2>
            <div class="info-row">
              <div class="label">Account Created:</div>
              <div class="value">${UserService.formatDate(userDetails.createdAt)}</div>
            </div>
            <div class="info-row">
              <div class="label">Last Updated:</div>
              <div class="value">${UserService.formatDate(userDetails.updatedAt)}</div>
            </div>
            <div class="info-row">
              <div class="label">Account Age:</div>
              <div class="value">${Math.floor((new Date().getTime() - new Date(userDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</div>
            </div>
          </div>

          <div class="section">
            <h2>Export Information</h2>
            <div class="info-row">
              <div class="label">Export Date:</div>
              <div class="value">${new Date().toLocaleString()}</div>
            </div>
            <div class="info-row">
              <div class="label">Export Format:</div>
              <div class="value">PDF Document</div>
            </div>
            <div class="info-row">
              <div class="label">Data Privacy:</div>
              <div class="value">Personal information - handle with care</div>
            </div>
          </div>

          <div class="section">
            <h2>Raw Data (JSON)</h2>
            <div class="json-data">${JSON.stringify(exportData, null, 2)}</div>
          </div>

          <div class="footer">
            <p><strong>User Profile Export</strong></p>
            <p>This document was automatically generated from your user profile.</p>
            <p>For privacy and security, please store this document securely and delete when no longer needed.</p>
            <p>Export ID: ${Date.now()}</p>
          </div>
        </body>
        </html>
      `;

      // Create downloadable file using multiple methods
      const fileName = `user-profile-${userDetails.username}-${new Date().toISOString().split('T')[0]}.html`;
      
      // Method 1: Direct download as HTML file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Method 2: Open in new window for PDF printing with better instructions
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load
        printWindow.onload = () => {
          setTimeout(() => {
            // Focus the window and show instructions
            printWindow.focus();
            
            // Try to trigger print dialog
            printWindow.print();
          }, 1000);
        };
        
        // Fallback if onload doesn't work
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 1500);
      }

      // Show detailed instructions to user
      const instructions = `✅ Export completed successfully!

📁 HTML file downloaded: "${fileName}"
   - Check your Downloads folder
   - Open the file in any browser
   - Use Ctrl+P (or Cmd+P on Mac) to print as PDF

🖨️ Print window opened:
   - Choose "Save as PDF" as destination
   - Click "Save" to download PDF
   - File will be saved to your chosen location

💡 Tip: The HTML file contains all your data and can be converted to PDF anytime!`;

      alert(instructions);

    } catch (error) {
      console.error('Error exporting data:', error);
      alert(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Sign out functionality
  const handleSignOut = async () => {
    const confirmed = confirm('Are you sure you want to sign out? You will be redirected to the login page.');
    
    if (confirmed) {
      try {
        // Call logout from auth context
        if (logout) {
          await logout();
        } else {
          // Fallback: clear localStorage and redirect
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos) : c;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          });
          
          // Redirect to login page
          window.location.href = '/signin';
        }
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <PageMeta
          title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
          description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <PageMeta
          title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
          description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Error Loading Profile</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show not authenticated state
  if (!isAuthenticated || !userDetails) {
    return (
      <>
        <PageMeta
          title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
          description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Authentication Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view your profile.</p>
              <a 
                href="/signin" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Sign In
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          {/* User Avatar & Header Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 animate-pulse"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {userDetails.username.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${
                  UserService.isUserActive(userDetails) 
                    ? 'bg-green-500' 
                    : userDetails.status === 'PENDING' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}></div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                  {userDetails.username}
                </h2>
                <p className="text-blue-600 dark:text-blue-300 text-lg mb-3">
                  {userDetails.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    UserService.getStatusColor(userDetails.status as any) === 'success' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : UserService.getStatusColor(userDetails.status as any) === 'warning'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {UserService.getStatusDisplayName(userDetails.status as any)}
                  </span>
                  {userDetails.roles.map((role, index) => (
                    <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      role.name === 'ROLE_ADMIN' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : role.name === 'ROLE_MODERATOR'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {UserService.getRoleDisplayName(role.name as any)}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleEditProfile}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
                <button 
                  onClick={() => alert('Security settings coming soon!')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </button>
                <button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
                <button 
                  onClick={handleSignOut}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Information */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Account Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-green-200 dark:border-green-700/50">
                    <span className="font-medium text-green-700 dark:text-green-300">User ID</span>
                    <span className="text-green-800 dark:text-green-200 font-mono text-sm">
                      {userDetails.id.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-green-200 dark:border-green-700/50">
                    <span className="font-medium text-green-700 dark:text-green-300">Username</span>
                    <span className="text-green-800 dark:text-green-200 font-semibold">
                      @{userDetails.username}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-green-200 dark:border-green-700/50">
                    <span className="font-medium text-green-700 dark:text-green-300">Email Address</span>
                    <span className="text-green-800 dark:text-green-200">
                      {userDetails.email}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-green-700 dark:text-green-300">Account Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        UserService.isUserActive(userDetails) ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-green-800 dark:text-green-200 font-semibold">
                        {UserService.getStatusDisplayName(userDetails.status as any)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles & Permissions */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  Roles & Permissions
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-purple-700 dark:text-purple-300 mb-3 block">Assigned Roles</span>
                    <div className="space-y-2">
                      {userDetails.roles.map((role, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              role.name === 'ROLE_ADMIN' 
                                ? 'bg-red-500'
                                : role.name === 'ROLE_MODERATOR'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {role.name === 'ROLE_ADMIN' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                ) : role.name === 'ROLE_MODERATOR' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                )}
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-purple-800 dark:text-purple-200">
                                {UserService.getRoleDisplayName(role.name as any)}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                {role.name}
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            role.name === 'ROLE_ADMIN' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : role.name === 'ROLE_MODERATOR'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-purple-200 dark:border-purple-700/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-purple-700 dark:text-purple-300">Permissions</span>
                      <span className="text-purple-600 dark:text-purple-400 text-sm">
                        {UserService.isAdmin(userDetails) ? 'Full Access' : 
                         UserService.isModerator(userDetails) ? 'Limited Access' : 'Basic Access'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Timeline & Activity */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-6 flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Account Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Account Created</div>
                  <div className="text-orange-600 dark:text-orange-400 text-sm">
                    {UserService.formatDate(userDetails.createdAt)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Last Updated</div>
                  <div className="text-orange-600 dark:text-orange-400 text-sm">
                    {UserService.formatDate(userDetails.updatedAt)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Account Age</div>
                  <div className="text-orange-600 dark:text-orange-400 text-sm">
                    {Math.floor((new Date().getTime() - new Date(userDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings & Actions */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/5 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                Account Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={handleEditProfile}
                  className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-left group"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Edit Profile</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Update personal information</div>
                </button>
                
                <button 
                  onClick={() => alert('Security settings coming soon! You can change your password in the Edit Profile section.')}
                  className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-left group"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Security</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Change password & 2FA</div>
                </button>
                
                <button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM12 17H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V11" />
                      </svg>
                    )}
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Download account data</div>
                </button>
                
                <button 
                  onClick={handleSignOut}
                  className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-left group"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Sign Out</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Sign out of all devices</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && userDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="profile-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Edit Profile</h2>
                    <p className="text-white/80">Update your account information</p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        placeholder="Enter username"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        3-20 characters, letters, numbers, and underscores only
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    Security
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Enter new password (leave blank to keep current)"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                </div>

                {/* Roles (Admin only) */}
                {UserService.isAdmin(userDetails) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      Roles & Permissions
                    </h3>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Select the roles for this user account:
                      </p>
                      
                      <div className="space-y-2">
                        {['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN'].map((role) => (
                          <label key={role} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.roles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm(prev => ({ ...prev, roles: [...prev.roles, role] }));
                                } else {
                                  setEditForm(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
                                }
                              }}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {UserService.getRoleDisplayName(role as any)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {role === 'ROLE_ADMIN' ? 'Full system access and user management' :
                                 role === 'ROLE_MODERATOR' ? 'Content moderation and limited admin access' :
                                 'Basic user access and functionality'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Info Display */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Current Account Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Account ID:</span>
                      <p className="font-mono text-gray-800 dark:text-gray-200">{userDetails.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-gray-800 dark:text-gray-200">{UserService.formatDate(userDetails.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <p className="text-gray-800 dark:text-gray-200">{UserService.getStatusDisplayName(userDetails.status as any)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <p className="text-gray-800 dark:text-gray-200">{UserService.formatDate(userDetails.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}