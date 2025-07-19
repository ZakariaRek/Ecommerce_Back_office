import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { PointTransactionService, TransactionResponseDto, TransactionType, TransactionSummaryDto } from "../../services/CrmPointsTransaction.service";

interface TransactionsListProps {
  userId?: string; // If provided, show transactions for specific user
  showUserColumn?: boolean; // Whether to show user ID column
}

export default function TransactionsList({ userId, showUserColumn = true }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<TransactionResponseDto[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'transactionDate' | 'points' | 'balance'>('transactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userIdInput, setUserIdInput] = useState(userId || "");

  const fetchTransactions = async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (targetUserId) {
        // Fetch transactions for specific user
        const [transactionData, summaryData] = await Promise.all([
          PointTransactionService.getTransactionHistory(targetUserId),
          PointTransactionService.getTransactionSummary(targetUserId)
        ]);
        setTransactions(transactionData);
        setSummary(summaryData);
      } else {
        // This would need a backend endpoint to get all transactions
        // For now, we'll show a message to enter a user ID
        setTransactions([]);
        setSummary(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions(userId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleUserSearch = () => {
    if (userIdInput.trim()) {
      fetchTransactions(userIdInput.trim());
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = () => {
    let filtered = PointTransactionService.searchTransactions(transactions, searchTerm);
    filtered = PointTransactionService.filterTransactionsByType(filtered, selectedType);
    return PointTransactionService.sortTransactions(filtered, sortBy, sortOrder);
  };

  const displayedTransactions = filteredAndSortedTransactions();

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
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
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading transactions</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => userId ? fetchTransactions(userId) : handleUserSearch()} 
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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-lg">⬆️</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {PointTransactionService.formatPoints(summary.totalPointsEarned)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-lg">⬇️</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Redeemed</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {PointTransactionService.formatPoints(summary.totalPointsRedeemed)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-lg">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {PointTransactionService.formatPoints(summary.currentBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-lg">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Per Earning</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(summary.averagePointsPerEarning)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="px-6 py-5 border-b border-gray-200/60 dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Point Transactions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {displayedTransactions.length} of {transactions.length} transactions shown
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Point System</span>
              </div>
            </div>
          </div>

          {/* User Search (if not showing specific user) */}
          {!userId && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter User ID to view transactions..."
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleUserSearch}
                  disabled={!userIdInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value={TransactionType.EARN}>Earned</option>
              <option value={TransactionType.REDEEM}>Redeemed</option>
              <option value={TransactionType.ADJUST}>Adjusted</option>
              <option value={TransactionType.EXPIRE}>Expired</option>
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
              <option value="transactionDate-desc">Newest First</option>
              <option value="transactionDate-asc">Oldest First</option>
              <option value="points-desc">Points (High to Low)</option>
              <option value="points-asc">Points (Low to High)</option>
              <option value="balance-desc">Balance (High to Low)</option>
              <option value="balance-asc">Balance (Low to High)</option>
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
                  Transaction
                </TableCell>
                {showUserColumn && (
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                  >
                    User
                  </TableCell>
                )}
                <TableCell
                  isHeader
                  className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                >
                  Points & Balance
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                >
                  Source & Details
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-200/60 dark:divide-white/[0.08]">
              {displayedTransactions.map((transaction) => (
                <TableRow 
                  key={transaction.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                           style={{ 
                             backgroundColor: PointTransactionService.getTransactionTypeColor(transaction.type) + '20',
                             color: PointTransactionService.getTransactionTypeColor(transaction.type)
                           }}>
                        {PointTransactionService.getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {PointTransactionService.getTransactionTypeDisplayName(transaction.type)}
                        </div>
                        <Badge
                          size="sm"
                          color={
                            transaction.type === TransactionType.EARN ? "success" :
                            transaction.type === TransactionType.REDEEM ? "warning" :
                            transaction.type === TransactionType.ADJUST ? "info" : "error"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {showUserColumn && (
                    <TableCell className="px-6 py-5">
                      <div className="text-sm font-mono text-gray-600 dark:text-gray-300">
                        {transaction.userId.slice(0, 8)}...
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="px-6 py-5">
                    <div className="space-y-1">
                      <div className={`font-semibold text-sm ${
                        transaction.type === TransactionType.EARN ? 'text-green-600' :
                        transaction.type === TransactionType.REDEEM ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {transaction.type === TransactionType.EARN ? '+' : transaction.type === TransactionType.REDEEM ? '-' : ''}
                        {PointTransactionService.formatPoints(transaction.points)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Balance: {PointTransactionService.formatPoints(transaction.balance)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {transaction.source}
                      </div>
                      {(transaction.relatedOrderId || transaction.relatedCouponId) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.relatedOrderId && `Order: ${transaction.relatedOrderId.slice(0, 8)}...`}
                          {transaction.relatedCouponId && `Coupon: ${transaction.relatedCouponId.slice(0, 8)}...`}
                        </div>
                      )}
                      {transaction.orderAmount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Order: ${transaction.orderAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {PointTransactionService.formatDate(transaction.transactionDate)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {displayedTransactions.length === 0 && !loading && transactions.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {!userId ? "Enter a User ID to view transactions" : "No transactions found"}
              </p>
            </div>
          </div>
        )}

        {displayedTransactions.length === 0 && transactions.length > 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No transactions match your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}