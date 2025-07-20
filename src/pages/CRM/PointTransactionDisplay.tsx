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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-green-200/50 dark:border-green-500/20 shadow-2xl">
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gradient-to-r from-green-400 to-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-green-200 rounded-full"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Loading Transactions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Fetching your transaction data...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-red-200/50 dark:border-red-500/20 shadow-2xl">
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{error}</p>
                </div>
                <button 
                  onClick={() => userId ? fetchTransactions(userId) : handleUserSearch()} 
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Transaction Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Monitor and analyze your point transactions with powerful insights
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-green-200/50 dark:border-green-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📈</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Earned</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {PointTransactionService.formatPoints(summary.totalPointsEarned)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-orange-200/50 dark:border-orange-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📉</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Redeemed</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {PointTransactionService.formatPoints(summary.totalPointsRedeemed)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">💎</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Balance</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {PointTransactionService.formatPoints(summary.currentBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg. Per Earning</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {Math.round(summary.averagePointsPerEarning)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Table Container */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-green-200/50 dark:border-green-500/20 shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="relative px-8 py-8 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-b border-green-200/50 dark:border-green-500/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Transaction History
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {displayedTransactions.length} of {transactions.length} transactions displayed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full border border-green-300/50">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Live Data
                  </span>
                </div>
              </div>
            </div>

            {/* User Search (if not showing specific user) */}
            {!userId && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/10 rounded-2xl border border-green-200/50">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Enter User ID to view transactions..."
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleUserSearch}
                    disabled={!userIdInput.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    Search
                  </button>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:text-white"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
                className="px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
              >
                <option value="all">All Transaction Types</option>
                <option value={TransactionType.EARN}>💰 Earned Points</option>
                <option value={TransactionType.REDEEM}>🎁 Redeemed Points</option>
                <option value={TransactionType.ADJUST}>⚙️ Adjusted Points</option>
                <option value={TransactionType.EXPIRE}>⏰ Expired Points</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
              >
                <option value="transactionDate-desc">📅 Newest First</option>
                <option value="transactionDate-asc">📅 Oldest First</option>
                <option value="points-desc">💎 Points (High to Low)</option>
                <option value="points-asc">💎 Points (Low to High)</option>
                <option value="balance-desc">💰 Balance (High to Low)</option>
                <option value="balance-asc">💰 Balance (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-gray-700/50 dark:to-gray-600/50">
                <TableRow className="border-b border-green-200/50 dark:border-green-500/20">
                  <TableCell
                    isHeader
                    className="px-8 py-6 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider"
                  >
                    Transaction
                  </TableCell>
                  {showUserColumn && (
                    <TableCell
                      isHeader
                      className="px-8 py-6 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider"
                    >
                      User
                    </TableCell>
                  )}
                  <TableCell
                    isHeader
                    className="px-8 py-6 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider"
                  >
                    Points & Balance
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-8 py-6 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider"
                  >
                    Source & Details
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-8 py-6 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider"
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-green-200/30 dark:divide-green-500/20">
                {displayedTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    className={`hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-300 group ${
                      index % 2 === 0 ? 'bg-white/30 dark:bg-gray-800/30' : 'bg-green-50/20 dark:bg-gray-700/20'
                    }`}
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                          transaction.type === TransactionType.EARN ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                          transaction.type === TransactionType.REDEEM ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                          transaction.type === TransactionType.ADJUST ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          <span className="text-white">
                            {transaction.type === TransactionType.EARN ? '📈' :
                             transaction.type === TransactionType.REDEEM ? '🎁' :
                             transaction.type === TransactionType.ADJUST ? '⚙️' : '⏰'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-base mb-1">
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
                      <TableCell className="px-8 py-6">
                        <div className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg">
                          <div className="text-sm font-mono text-gray-700 dark:text-gray-200">
                            {transaction.userId.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="px-8 py-6">
                      <div className="space-y-2">
                        <div className={`font-bold text-lg ${
                          transaction.type === TransactionType.EARN ? 'text-green-600' :
                          transaction.type === TransactionType.REDEEM ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {transaction.type === TransactionType.EARN ? '+' : transaction.type === TransactionType.REDEEM ? '-' : ''}
                          {PointTransactionService.formatPoints(transaction.points)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                          Balance: {PointTransactionService.formatPoints(transaction.balance)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-gray-900 dark:text-white max-w-xs">
                          {transaction.source}
                        </div>
                        {(transaction.relatedOrderId || transaction.relatedCouponId) && (
                          <div className="flex flex-wrap gap-2">
                            {transaction.relatedOrderId && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md">
                                Order: {transaction.relatedOrderId.slice(0, 8)}...
                              </span>
                            )}
                            {transaction.relatedCouponId && (
                              <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-md">
                                Coupon: {transaction.relatedCouponId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        )}
                        {transaction.orderAmount && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            Order Value: ${transaction.orderAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-8 py-6">
                      <div className="text-sm text-gray-600 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {PointTransactionService.formatDate(transaction.transactionDate)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty States */}
          {displayedTransactions.length === 0 && !loading && transactions.length === 0 && (
            <div className="flex items-center justify-center h-64 bg-gradient-to-br from-green-50/30 to-emerald-50/30">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <span className="text-3xl text-white">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {!userId ? "Ready to explore transactions" : "No transactions found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {!userId ? "Enter a User ID above to view their transaction history" : "This user hasn't made any transactions yet"}
                </p>
              </div>
            </div>
          )}

          {displayedTransactions.length === 0 && transactions.length > 0 && (
            <div className="flex items-center justify-center h-64 bg-gradient-to-br from-orange-50/30 to-red-50/30">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <span className="text-3xl text-white">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No matching transactions</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search filters to see more results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}