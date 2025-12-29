'use client';

import { useState, useTransition } from 'react';
import { Search, Filter, Grid3x3, List, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from './ProductCard';
import { ProductComparisonModal } from './ProductComparisonModal';
import { searchProducts } from '@/app/actions/materials';
import { motion, AnimatePresence } from 'framer-motion';
import type { HomeDepotProduct } from '@/lib/services/home-depot-api';

interface Project {
  id: string;
  name: string;
}

interface MaterialsSearchProps {
  projects: Project[];
}

export function MaterialsSearch({ projects }: MaterialsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<HomeDepotProduct[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<HomeDepotProduct[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    startTransition(async () => {
      const result = await searchProducts({
        query: searchQuery || undefined,
        category: category === 'all' ? undefined : category,
        stockStatus: stockFilter === 'all' ? undefined : (stockFilter as any),
      });

      if (result.success && result.data) {
        setProducts(result.data.products);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleComparison = (product: HomeDepotProduct) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else if (prev.length < 4) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
    setShowComparison(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search Controls */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-3 md:p-6 shadow-construction">
        <div className="space-y-3 md:space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search Home Depot products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9 md:pl-10 h-11 md:h-12 text-sm md:text-base border-2 focus:border-construction-blue w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isPending}
              className="h-11 md:h-12 px-4 md:px-6 bg-construction-blue hover:bg-construction-blue/90 text-white font-bold w-full md:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  <span className="text-sm md:text-base">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">Search</span>
                </>
              )}
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 flex-1">
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600">Filters:</span>
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] border-2 h-10 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="lumber">Lumber</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="paint">Paint & Supplies</SelectItem>
                  <SelectItem value="drywall">Drywall</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] border-2 h-10 text-sm">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg self-start md:self-auto border border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-construction-blue text-white hover:bg-construction-blue/90' : 'hover:bg-gray-200'}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 ${viewMode === 'list' ? 'bg-construction-blue text-white hover:bg-construction-blue/90' : 'hover:bg-gray-200'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Bar */}
      <AnimatePresence>
        {selectedForComparison.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-construction-blue text-white border-2 border-construction-blue rounded-lg p-3 md:p-4 shadow-construction-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="font-bold text-sm md:text-base">
                  {selectedForComparison.length} product{selectedForComparison.length !== 1 ? 's' : ''} selected
                </span>
                <span className="text-xs md:text-sm opacity-80">
                  (Max 4 products)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowComparison(true)}
                  disabled={selectedForComparison.length < 2}
                  variant="secondary"
                  size="sm"
                  className="font-bold text-xs md:text-sm flex-1 sm:flex-none"
                >
                  Compare
                </Button>
                <Button
                  onClick={clearComparison}
                  variant="outline"
                  size="sm"
                  className="border-white text-white hover:bg-white hover:text-construction-blue text-xs md:text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4'
          : 'space-y-3 md:space-y-4'
        }>
          <AnimatePresence mode="popLayout">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  projects={projects}
                  viewMode={viewMode}
                  isSelectedForComparison={selectedForComparison.some(p => p.id === product.id)}
                  onToggleComparison={toggleComparison}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : isPending ? (
        <div className="flex items-center justify-center py-12 md:py-16">
          <div className="text-center space-y-3 md:space-y-4">
            <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-construction-blue mx-auto" />
            <p className="text-sm md:text-lg font-semibold text-gray-600">Searching Home Depot catalog...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center">
          <Search className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 md:mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Search for Materials</h3>
          <p className="text-sm md:text-base text-gray-600 px-4">
            Enter a product name or browse by category to find materials from Home Depot
          </p>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <ProductComparisonModal
          products={selectedForComparison}
          projects={projects}
          onClose={() => setShowComparison(false)}
          onClearSelection={clearComparison}
        />
      )}
    </div>
  );
}
