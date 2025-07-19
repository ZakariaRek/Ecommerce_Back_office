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

export default function LoyaltyDashboard() {
  const [users, setUsers] = useState<CrmResponseDto[]>([]);
  const [rewards, setRewards] = useState<RewardResponseDto[]>([]);
  const [tierBenefits, setTierBenefits] = useState<TierBenefitResponseDto[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'users' | 'rewards' | 'benefits'>('overview');

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
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading loyalty dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-sm dark:border-red-500/20 dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading dashboard</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loyalty Service Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Overview of your customer loyalty program
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live Data</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'users', label: 'Users', icon: '👥' },
            { key: 'rewards', label: 'Rewards', icon: '🎁' },
            { key: 'benefits', label: 'Benefits', icon: '⭐' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {selectedView === 'overview' && stats && (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">👥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPointsInSystem.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">🎁</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Rewards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalActiveRewards}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(stats.averagePoints).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Membership Tier Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.tierDistribution).map(([tier, count]) => {
                const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={tier} className="text-center">
                    <div 
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-2"
                      style={{ backgroundColor: CRMService.getTierColor(tier as MembershipTier) + '20' }}
                    >
                      {CRMService.getTierIcon(tier as MembershipTier)}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {CRMService.getTierDisplayName(tier as MembershipTier)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Users View */}
      {selectedView === 'users' && (
        <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
          <div className="space-y-3">
            {users.slice(0, 10).map((user) => {
              const tierProgress = CRMService.calculateTierProgress(user.totalPoints, user.membershipLevel);
              return (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: CRMService.getTierColor(user.membershipLevel) + '20' }}
                    >
                      {CRMService.getTierIcon(user.membershipLevel)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.userId.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Joined {CRMService.formatDate(user.joinDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {CRMService.formatPoints(user.totalPoints)} pts
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
              );
            })}
          </div>
          {users.length > 10 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              And {users.length - 10} more users...
            </p>
          )}
        </div>
      )}

      {/* Rewards View */}
      {selectedView === 'rewards' && (
        <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const category = LoyaltyRewardService.getRewardCategory(reward.pointsCost);
              return (
                <div key={reward.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {LoyaltyRewardService.getRewardIcon(reward.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {reward.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {reward.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge size="sm" color={category.color as any}>
                          {LoyaltyRewardService.formatPoints(reward.pointsCost)} pts
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {reward.expiryDays}d expiry
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Benefits View */}
      {selectedView === 'benefits' && (
        <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tier Benefits</h3>
          <div className="space-y-4">
            {Object.values(MembershipTier).map((tier) => {
              const tierBenefitsForTier = tierBenefits.filter(benefit => benefit.tier === tier);
              return (
                <div key={tier} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: CRMService.getTierColor(tier) + '20' }}
                    >
                      {CRMService.getTierIcon(tier)}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {CRMService.getTierDisplayName(tier)} Tier
                    </h4>
                    <Badge size="sm" color="info">
                      {tierBenefitsForTier.length} benefits
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tierBenefitsForTier.map((benefit) => (
                      <div key={benefit.id} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">
                          {TierBenefitsService.getBenefitTypeIcon(benefit.benefitType)}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {TierBenefitsService.generateBenefitDescription(benefit)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {tierBenefitsForTier.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No benefits configured</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}