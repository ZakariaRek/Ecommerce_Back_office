import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CartService, ShoppingCartResponse, CartItemResponse } from '../services/Cart.service';

interface ShoppingCartDropdownProps {
  userId?: string; // You'll need to pass the current user ID
}

const ShoppingCartDropdown: React.FC<ShoppingCartDropdownProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<ShoppingCartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load cart when dropdown opens
  useEffect(() => {
    if (isOpen && userId && !cart) {
      loadCart();
    }
  }, [isOpen, userId]);

  const loadCart = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const cartData = await CartService.getCart(userId);
      setCart(cartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    if (!userId) return;

    try {
      const updatedCart = await CartService.removeItemFromCart(userId, productId);
      setCart(updatedCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!userId) return;

    try {
      const updatedCart = await CartService.updateItemQuantity(userId, productId, { quantity });
      setCart(updatedCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    }
  };

  const getCartItemCount = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const cartItemCount = getCartItemCount();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:h-11 lg:w-11"
        aria-label="Shopping Cart"
      >
      <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className="w-5 h-5"
>
  <path
    d="M7 18C6.45 18 6 18.45 6 19C6 19.55 6.45 20 7 20C7.55 20 8 19.55 8 19C8 18.45 7.55 18 7 18ZM17 18C16.45 18 16 18.45 16 19C16 19.55 16.45 20 17 20C17.55 20 18 19.55 18 19C18 18.45 17.55 18 17 18ZM7.16 14H17.54C18.12 14 18.62 13.63 18.82 13.09L21.67 5.59C21.87 5.05 21.47 4.5 20.89 4.5H5.21L4.27 2H1V4H3L6.6 11.59L5.25 14.04C4.66 15.04 5.4 16.25 6.54 16.25H19V14H7.42L7.16 14Z"
    fill="currentColor"
  />
</svg>

        {/* Cart Item Count Badge */}
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-80 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Shopping Cart
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading cart...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={loadCart}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  Try again
                </button>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                <Link
                  to="/products"
                  className="inline-block mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="p-4 space-y-4">
                  {cart.items.map((item: CartItemResponse) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {/* Placeholder for product image */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg dark:bg-gray-700 flex-shrink-0">
                        <div className="w-full h-full bg-gray-200 rounded-lg dark:bg-gray-600"></div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          Product ID: {item.productId.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {CartService.formatCurrency(item.price)} each
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {/* Subtotal and Remove */}
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {CartService.formatCurrency(item.subtotal)}
                        </p>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="mt-1 text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {CartService.formatCurrency(cart.total)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to="/cart"
                      className="block w-full px-4 py-2 text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      View Cart
                    </Link>
                    <Link
                      to="/checkout"
                      className="block w-full px-4 py-2 text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCartDropdown;