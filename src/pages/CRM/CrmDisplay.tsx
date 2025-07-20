import { useState, useEffect } from "react";
import Badge from "../../components/ui/badge/Badge";
import { CRMService, CrmResponseDto, MembershipTier } from "../../services/Crm.service";

// Modern blue-themed styles with glassmorphism
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #eff6ff;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #1d4ed8, #1e40af);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(59, 130, 246, 0.1);
  }
  .dark .glass-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  .blue-gradient {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
  }
  .user-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .dark .user-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    border: 1px solid #374151;
  }
  .user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05);
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }
  .animate-slideInRight {
    animation: slideInRight 0.5s ease-out;
  }
  .animate-pulse-gentle {
    animation: pulseGentle 2s ease-in-out infinite;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulseGentle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

// Simple input components with blue theme
const Input = ({ type, value, onChange, placeholder, className }: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all duration-200 ${className}`}
  />
);

const Select = ({ options, value, onChange, className }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all duration-200 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default function CRMUsersList() {
  const [users, setUsers] = useState<CrmResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<MembershipTier | 'all'>('all');
  const [sortBy, setSortBy] = useState<'totalPoints' | 'membershipLevel' | 'joinDate' | 'lastActivity'>('totalPoints');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Inject custom styles
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
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await CRMService.getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching CRM users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = () => {
    let filtered = CRMService.searchUsers(users, searchTerm);
    filtered = CRMService.filterUsersByTier(filtered, selectedTier);
    return CRMService.sortUsers(filtered, sortBy, sortOrder);
  };

  const displayedUsers = filteredAndSortedUsers();

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    averagePoints: users.length > 0 ? users.reduce((sum, user) => sum + user.totalPoints, 0) / users.length : 0,
    averageLoyaltyScore: users.length > 0 ? users.reduce((sum, user) => sum + (user.loyaltyScore || 0), 0) / users.length : 0,
    topTierUsers: users.filter(user => user.membershipLevel === MembershipTier.DIAMOND || user.membershipLevel === MembershipTier.PLATINUM).length
  };

  const getTierOptions = () => [
    { value: 'all', label: 'All Tiers' },
    { value: MembershipTier.BRONZE, label: 'Bronze' },
    { value: MembershipTier.SILVER, label: 'Silver' },
    { value: MembershipTier.GOLD, label: 'Gold' },
    { value: MembershipTier.PLATINUM, label: 'Platinum' },
    { value: MembershipTier.DIAMOND, label: 'Diamond' }
  ];

  const getSortOptions = () => [
    { value: 'totalPoints-desc', label: 'Points (High to Low)' },
    { value: 'totalPoints-asc', label: 'Points (Low to High)' },
    { value: 'membershipLevel-desc', label: 'Tier (High to Low)' },
    { value: 'membershipLevel-asc', label: 'Tier (Low to High)' },
    { value: 'joinDate-desc', label: 'Newest First' },
    { value: 'joinDate-asc', label: 'Oldest First' },
    { value: 'lastActivity-desc', label: 'Recently Active' }
  ];

  const renderUserCard = (user: CrmResponseDto, index: number) => {
    const tierProgress = CRMService.calculateTierProgress(user.totalPoints, user.membershipLevel);
    const loyaltyScoreLevel = user.loyaltyScore ? CRMService.getLoyaltyScoreLevel(user.loyaltyScore) : null;
    const animationClass = index % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight';
    
    return (
      <div key={user.id} className={`user-card transition-all duration-300 rounded-xl p-6 ${animationClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
          {/* Left Section - User Info & Tier */}
          <div className="flex items-center space-x-4 flex-1 mb-4 lg:mb-0">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4"
                style={{ 
                  backgroundColor: CRMService.getTierColor(user.membershipLevel) + '20',
                  borderColor: CRMService.getTierColor(user.membershipLevel) + '40'
                }}
              >
                {CRMService.getTierIcon(user.membershipLevel)}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Badge
                  size="sm"
                  color={
                    user.membershipLevel === MembershipTier.DIAMOND ? "success" :
                    user.membershipLevel === MembershipTier.PLATINUM ? "purple" :
                    user.membershipLevel === MembershipTier.GOLD ? "warning" :
                    user.membershipLevel === MembershipTier.SILVER ? "info" : "gray"
                  }
                >
                  {CRMService.getTierDisplayName(user.membershipLevel)}
                </Badge>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  User #{user.userId.slice(0, 8)}...
                </h3>
                {user.loyaltyScore && loyaltyScoreLevel && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-gentle"></div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {loyaltyScoreLevel.level}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-semibold">{CRMService.formatPoints(user.totalPoints)} pts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Joined {CRMService.formatDate(user.joinDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Progress & Loyalty */}
          <div className="flex-1 space-y-4 mb-4 lg:mb-0">
            {/* Tier Progress */}
            {tierProgress.nextTier !== user.membershipLevel && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progress to {CRMService.getTierDisplayName(tierProgress.nextTier)}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {tierProgress.progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, tierProgress.progressPercentage)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {CRMService.formatPoints(tierProgress.pointsNeededForNextTier)} points needed
                </div>
              </div>
            )}

            {/* Loyalty Score */}
            {user.loyaltyScore && loyaltyScoreLevel ? (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Loyalty Score</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {CRMService.formatLoyaltyScore(user.loyaltyScore)}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  loyaltyScoreLevel.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                  loyaltyScoreLevel.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  loyaltyScoreLevel.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  loyaltyScoreLevel.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <svg className={`w-6 h-6 ${
                    loyaltyScoreLevel.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    loyaltyScoreLevel.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    loyaltyScoreLevel.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                    loyaltyScoreLevel.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <span className="text-gray-400 dark:text-gray-500 text-sm">Loyalty score not calculated</span>
              </div>
            )}
          </div>

          {/* Right Section - Activity & Actions */}
          <div className="flex flex-col space-y-3 lg:items-end">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Last Active</div>
                <div className="text-xs">{CRMService.formatDate(user.lastActivity)}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              ID: {user.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading CRM users...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Analyzing loyalty data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl max-w-md w-full shadow-2xl border border-red-200 dark:border-red-500/20">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="blue-gradient text-white p-8 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl font-bold mb-3">Loyalty CRM Dashboard</h1>
                    <p className="text-lg text-blue-100 max-w-md">
                      Track customer engagement and reward loyalty across all tiers
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse-gentle"></div>
                      <span className="text-sm font-medium text-blue-100">Live Data</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{displayedUsers.length}</div>
                      <div className="text-blue-100 text-sm">Active Users</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Users",
              value: stats.totalUsers.toLocaleString(),
              icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
              color: "from-blue-400 to-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20"
            },
            {
              title: "Avg Points",
              value: Math.round(stats.averagePoints).toLocaleString(),
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
              color: "from-emerald-400 to-emerald-600",
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
            },
            {
              title: "Avg Loyalty Score",
              value: stats.averageLoyaltyScore.toFixed(1),
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              color: "from-purple-400 to-purple-600",
              bgColor: "bg-purple-50 dark:bg-purple-900/20"
            },
            {
              title: "Premium Members",
              value: stats.topTierUsers.toString(),
              icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
              color: "from-yellow-400 to-yellow-600",
              bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
            }
          ].map((stat, index) => (
            <div key={stat.title} className={`glass-card rounded-xl p-6 animate-fadeIn ${stat.bgColor} border-l-4 border-l-blue-500`} style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by ID or membership details..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Select
                options={getTierOptions()}
                value={selectedTier as string}
                onChange={(value) => setSelectedTier(value as MembershipTier | 'all')}
                className="min-w-[160px]"
              />
              
              <Select
                options={getSortOptions()}
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="min-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {displayedUsers.length === 0 && !loading ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Users Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchTerm || selectedTier !== 'all' 
                  ? 'No users match your current search criteria. Try adjusting your filters.' 
                  : 'Your CRM database appears to be empty. Users will appear here once they join your loyalty program.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedUsers.map((user, index) => renderUserCard(user, index))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {displayedUsers.length > 0 && (
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Showing <span className="font-semibold text-blue-600 dark:text-blue-400">{displayedUsers.length}</span> of{' '}
              <span className="font-semibold">{users.length}</span> total users
              {searchTerm && (
                <span> matching "<span className="font-medium">{searchTerm}</span>"</span>
              )}
              {selectedTier !== 'all' && (
                <span> in <span className="font-medium">{CRMService.getTierDisplayName(selectedTier as MembershipTier)}</span> tier</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}