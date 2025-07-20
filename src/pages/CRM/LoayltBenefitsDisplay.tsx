import { useState, useEffect } from "react";
import { CRMService, CrmResponseDto, MembershipTier } from "../../services/Crm.service";
import { LoyaltyRewardService, RewardResponseDto } from "../../services/CrmLoyaltyReward.service";
import { TierBenefitsService, TierBenefitResponseDto } from "../../services/CrmTierBenefits.service";
import Badge from "../../components/ui/badge/Badge";

interface DashboardStats {
  totalUsers: number;
  totalActiveRewards: number;
  totalTierBenefits: number;
  tierDistribution: Record<MembershipTier, number>;
  averagePoints: number;
  totalPointsInSystem: number;
}

// Modern dashboard styles with glassmorphism and vibrant gradients
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #8b5cf6, #6366f1);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #7c3aed, #4f46e5);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  .dark .glass-card {
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  .gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .gradient-secondary {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .gradient-success {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .gradient-warning {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  .stat-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }
  .dark .stat-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .stat-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  .tier-ring {
    position: relative;
    width: 120px;
    height: 120px;
  }
  .tier-ring::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .animate-slide-up {
    animation: slideUp 0.6s ease-out;
  }
  .animate-fade-in-delayed {
    animation: fadeInDelayed 0.8s ease-out;
  }
  .animate-pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite alternate;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDelayed {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
    100% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.8); }
  }
  .nav-tab {
    position: relative;
    overflow: hidden;
  }
  .nav-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }
  .nav-tab:hover::before {
    left: 100%;
  }
`;

export default function LoyaltyDashboard() {
  const [users, setUsers] = useState<CrmResponseDto[]>([]);
  const [rewards, setRewards] = useState<RewardResponseDto[]>([]);
  const [tierBenefits, setTierBenefits] = useState<TierBenefitResponseDto[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'users' | 'rewards' | 'benefits'>('overview');

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
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [usersData, rewardsData, benefitsData] = await Promise.all([
          CRMService.getAllUsers(),
          LoyaltyRewardService.getActiveRewards(),
          TierBenefitsService.getActiveTierBenefits()
        ]);
        
        setUsers(usersData);
        setRewards(rewardsData);
        setTierBenefits(benefitsData);
        
        // Calculate stats
        const tierDistribution = usersData.reduce((acc, user) => {
          acc[user.membershipLevel] = (acc[user.membershipLevel] || 0) + 1;
          return acc;
        }, {} as Record<MembershipTier, number>);
        
        const totalPoints = usersData.reduce((sum, user) => sum + user.totalPoints, 0);
        const averagePoints = usersData.length > 0 ? totalPoints / usersData.length : 0;
        
        setStats({
          totalUsers: usersData.length,
          totalActiveRewards: rewardsData.length,
          totalTierBenefits: benefitsData.length,
          tierDistribution,
          averagePoints,
          totalPointsInSystem: totalPoints
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">Gathering loyalty insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl max-w-md w-full p-8 text-center border border-red-200 dark:border-red-500/20">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">Dashboard Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Retry Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="glass-card rounded-3xl overflow-hidden animate-slide-up">
          <div className="gradient-primary text-white p-8 relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
              <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
            </div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h1 className="text-4xl font-bold mb-3">Loyalty Command Center</h1>
                  <p className="text-lg text-purple-100 max-w-md">
                    Real-time insights into your customer loyalty ecosystem
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-glow"></div>
                      <span className="text-sm font-medium">Live Analytics</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                    <div className="text-purple-100 text-sm">Total Members</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-white/20 p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'overview', label: 'Dashboard Overview', icon: '📊', gradient: 'from-blue-500 to-purple-600' },
                { key: 'users', label: 'Member Analytics', icon: '👥', gradient: 'from-green-500 to-teal-600' },
                { key: 'rewards', label: 'Reward Catalog', icon: '🎁', gradient: 'from-pink-500 to-rose-600' },
                { key: 'benefits', label: 'Tier Benefits', icon: '⭐', gradient: 'from-yellow-500 to-orange-600' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedView(tab.key as any)}
                  className={`nav-tab flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedView === tab.key
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70 hover:scale-102'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Dashboard */}
        {selectedView === 'overview' && stats && (
          <div className="space-y-8">
            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Active Members",
                  value: stats.totalUsers.toLocaleString(),
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  gradient: "from-blue-500 to-blue-600",
                  bgGradient: "from-blue-50 to-indigo-50",
                  darkBgGradient: "from-blue-900/20 to-indigo-900/20"
                },
                {
                  title: "Points in Circulation",
                  value: stats.totalPointsInSystem.toLocaleString(),
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
                  gradient: "from-green-500 to-emerald-600",
                  bgGradient: "from-green-50 to-emerald-50",
                  darkBgGradient: "from-green-900/20 to-emerald-900/20"
                },
                {
                  title: "Active Rewards",
                  value: stats.totalActiveRewards.toString(),
                  icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
                  gradient: "from-purple-500 to-pink-600",
                  bgGradient: "from-purple-50 to-pink-50",
                  darkBgGradient: "from-purple-900/20 to-pink-900/20"
                },
                {
                  title: "Average Points",
                  value: Math.round(stats.averagePoints).toLocaleString(),
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  gradient: "from-orange-500 to-red-600",
                  bgGradient: "from-orange-50 to-red-50",
                  darkBgGradient: "from-orange-900/20 to-red-900/20"
                }
              ].map((stat, index) => (
                <div 
                  key={stat.title} 
                  className={`stat-card rounded-2xl p-6 bg-gradient-to-br ${stat.bgGradient} dark:${stat.darkBgGradient} animate-fade-in-delayed`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier Distribution Visualization */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">Membership Tier Distribution</h3>
              <div className="flex flex-wrap justify-center gap-8">
                {Object.entries(stats.tierDistribution).map(([tier, count]) => {
                  const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                  return (
                    <div key={tier} className="text-center group">
                      <div className="tier-ring mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <div 
                          className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl"
                          style={{ 
                            background: `conic-gradient(${CRMService.getTierColor(tier as MembershipTier)} ${percentage * 3.6}deg, #f1f5f9 0deg)`,
                          }}
                        >
                          <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl bg-white dark:bg-gray-800 shadow-inner"
                          >
                            {CRMService.getTierIcon(tier as MembershipTier)}
                          </div>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{count}</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {CRMService.getTierDisplayName(tier as MembershipTier)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users Analytics */}
        {selectedView === 'users' && (
          <div className="dashboard-grid">
            {/* Top Users */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Top Performers</h3>
                <Badge size="sm" color="success">{users.length} Total Users</Badge>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {users
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .slice(0, 12)
                  .map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl backdrop-blur-sm hover:scale-102 transition-transform duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                          style={{ backgroundColor: CRMService.getTierColor(user.membershipLevel) + '20' }}
                        >
                          {CRMService.getTierIcon(user.membershipLevel)}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          User #{user.userId.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Member since {CRMService.formatDate(user.joinDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {CRMService.formatPoints(user.totalPoints)}
                      </p>
                      <Badge size="sm" color={
                        user.membershipLevel === MembershipTier.DIAMOND ? "success" :
                        user.membershipLevel === MembershipTier.PLATINUM ? "purple" :
                        user.membershipLevel === MembershipTier.GOLD ? "warning" :
                        user.membershipLevel === MembershipTier.SILVER ? "info" : "gray"
                      }>
                        {CRMService.getTierDisplayName(user.membershipLevel)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {users
                  .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                  .slice(0, 8)
                  .map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: CRMService.getTierColor(user.membershipLevel) + '30' }}
                    >
                      {CRMService.getTierIcon(user.membershipLevel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        #{user.userId.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {CRMService.formatDate(user.lastActivity)}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Catalog */}
        {selectedView === 'rewards' && (
          <div className="dashboard-grid">
            {rewards.map((reward) => {
              const category = LoyaltyRewardService.getRewardCategory(reward.pointsCost);
              return (
                <div key={reward.id} className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start space-x-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {LoyaltyRewardService.getRewardIcon(reward.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                        {reward.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge size="lg" color={category.color as any}>
                      {LoyaltyRewardService.formatPoints(reward.pointsCost)} Points
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expires in</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{reward.expiryDays} days</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tier Benefits */}
        {selectedView === 'benefits' && (
          <div className="space-y-6">
            {Object.values(MembershipTier).map((tier) => {
              const tierBenefitsForTier = tierBenefits.filter(benefit => benefit.tier === tier);
              return (
                <div key={tier} className="glass-card rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-4"
                      style={{ 
                        backgroundColor: CRMService.getTierColor(tier) + '20',
                        borderColor: CRMService.getTierColor(tier) + '40'
                      }}
                    >
                      {CRMService.getTierIcon(tier)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {CRMService.getTierDisplayName(tier)} Tier
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {tierBenefitsForTier.length} exclusive benefits
                      </p>
                    </div>
                  </div>
                  
                  {tierBenefitsForTier.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tierBenefitsForTier.map((benefit) => (
                        <div key={benefit.id} className="bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {TierBenefitsService.getBenefitTypeIcon(benefit.benefitType)}
                            </span>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {TierBenefitsService.generateBenefitDescription(benefit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No benefits configured for this tier</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}