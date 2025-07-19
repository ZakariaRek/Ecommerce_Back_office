import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { CRMService, CrmResponseDto, MembershipTier } from "../../services/Crm.service";

export default function CRMUsersList() {
  const [users, setUsers] = useState<CrmResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<MembershipTier | 'all'>('all');
  const [sortBy, setSortBy] = useState<'totalPoints' | 'membershipLevel' | 'joinDate' | 'lastActivity'>('totalPoints');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading CRM users...</p>
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
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading CRM users</p>
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
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-900/40">
      <div className="px-6 py-5 border-b border-gray-200/60 dark:border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loyalty CRM Users</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {displayedUsers.length} of {users.length} users shown
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Loyalty System</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as MembershipTier | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Tiers</option>
            <option value={MembershipTier.BRONZE}>Bronze</option>
            <option value={MembershipTier.SILVER}>Silver</option>
            <option value={MembershipTier.GOLD}>Gold</option>
            <option value={MembershipTier.PLATINUM}>Platinum</option>
            <option value={MembershipTier.DIAMOND}>Diamond</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="totalPoints-desc">Points (High to Low)</option>
            <option value="totalPoints-asc">Points (Low to High)</option>
            <option value="membershipLevel-desc">Tier (High to Low)</option>
            <option value="membershipLevel-asc">Tier (Low to High)</option>
            <option value="joinDate-desc">Newest First</option>
            <option value="joinDate-asc">Oldest First</option>
            <option value="lastActivity-desc">Recently Active</option>
          </select>
        </div>
      </div>
      
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow className="border-b border-gray-200/60 dark:border-white/[0.08]">
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                User & Tier
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Points & Progress
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Loyalty Score
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Membership
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Activity
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200/60 dark:divide-white/[0.08]">
            {displayedUsers.map((user) => {
              const tierProgress = CRMService.calculateTierProgress(user.totalPoints, user.membershipLevel);
              const loyaltyScoreLevel = user.loyaltyScore ? CRMService.getLoyaltyScoreLevel(user.loyaltyScore) : null;
              
              return (
                <TableRow 
                  key={user.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" 
                           style={{ backgroundColor: CRMService.getTierColor(user.membershipLevel) + '20' }}>
                        {CRMService.getTierIcon(user.membershipLevel)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          User ID: {user.userId.slice(0, 8)}...
                        </div>
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
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {CRMService.formatPoints(user.totalPoints)} points
                      </div>
                      {tierProgress.nextTier !== user.membershipLevel && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress to {CRMService.getTierDisplayName(tierProgress.nextTier)}</span>
                            <span>{tierProgress.progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, tierProgress.progressPercentage)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {CRMService.formatPoints(tierProgress.pointsNeededForNextTier)} points needed
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    {user.loyaltyScore && loyaltyScoreLevel ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {CRMService.formatLoyaltyScore(user.loyaltyScore)}
                        </div>
                        <Badge
                          size="sm"
                          color={
                            loyaltyScoreLevel.color === 'green' ? 'success' :
                            loyaltyScoreLevel.color === 'blue' ? 'info' :
                            loyaltyScoreLevel.color === 'orange' ? 'warning' :
                            loyaltyScoreLevel.color === 'yellow' ? 'warning' : 'error'
                          }
                        >
                          {loyaltyScoreLevel.level}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not calculated</span>
                    )}
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        Joined: {CRMService.formatDate(user.joinDate)}
                      </div>
                      <div className="text-xs">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {CRMService.formatDate(user.lastActivity)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {displayedUsers.length === 0 && !loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        </div>
      )}
    </div>
  );
}