'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
  fetchLog?: {
    lastFetchedAt: string;
    refreshPeriodDays: number;
    storesFetched: number;
    discountsFetched: number;
    fetchStatus: string;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRefreshPeriod = async (categoryId: number, refreshPeriodDays: number) => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/categories/refresh-period', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, refreshPeriodDays })
      });
      
      if (response.ok) {
        setMessage('Refresh period updated successfully!');
        fetchCategories(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error updating refresh period');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshPeriodChange = (categoryId: number, value: number) => {
    updateRefreshPeriod(categoryId, value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure refresh periods and monitor category performance
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Category Configuration
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refresh Period (Days)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Fetched
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discounts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={category.fetchLog?.refreshPeriodDays || 3}
                        onChange={(e) => handleRefreshPeriodChange(category.id, parseInt(e.target.value))}
                        disabled={saving}
                        className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                        <option value={10}>10</option>
                        <option value={14}>14</option>
                        <option value={30}>30</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(category.fetchLog?.lastFetchedAt || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(category.fetchLog?.fetchStatus || 'unknown')}`}>
                        {category.fetchLog?.fetchStatus || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.fetchLog?.storesFetched || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.fetchLog?.discountsFetched || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Configuration Help</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Refresh Period:</strong> How often the system should fetch new data for each category. Lower values mean more frequent updates but higher API costs.</p>
          <p><strong>Last Fetched:</strong> When the category was last updated with fresh data.</p>
          <p><strong>Status:</strong> The result of the last fetch operation (success, failed, or partial).</p>
          <p><strong>Stores/Discounts:</strong> Number of stores and discounts found in the last fetch.</p>
          <p><strong>Recommended Settings:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>High-value categories (Electronics, Fashion): 1-3 days</li>
            <li>Medium-value categories (Food, Services): 3-7 days</li>
            <li>Low-value categories (Books, Home): 7-14 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

