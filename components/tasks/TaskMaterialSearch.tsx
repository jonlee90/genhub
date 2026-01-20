"use client";

/**
 * TaskMaterialSearch Component
 *
 * Compact search interface for finding Home Depot products within the task modal.
 * Uses debounced search and displays results as compact cards with quick-add functionality.
 *
 * Construction-themed with #001B51 primary, debounced 500ms search
 */

import { useState, useTransition, useCallback, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Plus,
  Package,
  AlertCircle,
  CheckCircle2,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { searchProducts, addProductToTask } from "@/app/actions/materials";
import { useToast } from "@/hooks/use-toast";
import type { HomeDepotProduct } from "@/lib/services/home-depot-api";

// Interface definitions
import type { TempMaterial } from ".//TaskMaterialsManager";

interface TaskMaterialSearchProps {
  taskId?: string;              // Optional for create mode
  projectId: string;
  onMaterialAdded: () => void;  // Edit mode callback
  mode?: "create" | "edit";     // Mode determines behavior
  tempMaterials?: TempMaterial[];
  onTempMaterialAdd?: (material: TempMaterial) => void;
}

// Stock status configuration
const STOCK_STATUS_CONFIG = {
  in_stock: {
    label: "In Stock",
    color: "bg-construction-green/10 text-construction-green border-construction-green/30",
  },
  low_stock: {
    label: "Low Stock",
    color: "bg-amber-50 text-amber-700 border-amber-300",
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "bg-red-50 text-red-700 border-red-300",
  },
  special_order: {
    label: "Special Order",
    color: "bg-construction-blue/10 text-construction-blue border-construction-blue/30",
  },
};

export function TaskMaterialSearch({
  taskId,
  projectId,
  onMaterialAdded,
  mode = "edit",
  tempMaterials = [],
  onTempMaterialAdd,
}: TaskMaterialSearchProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<HomeDepotProduct[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    startSearch(async () => {
      const result = await searchProducts({
        query: searchQuery,
        limit: 12, // Limit results for modal context
      });

      if (result.success && result.data) {
        setProducts(result.data.products);
      } else {
        toast({
          title: "Search Failed",
          description: result.error || "Failed to search products",
          variant: "destructive",
        });
      }
      setHasSearched(true);
    });
  }, [searchQuery, toast]);

  // Get quantity for a product
  const getQuantity = (productId: string) => quantities[productId] || 1;

  // Update quantity for a product
  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  // Set quantity directly
  const setQuantity = (productId: string, value: number) => {
    const newValue = Math.max(1, value);
    setQuantities(prev => ({ ...prev, [productId]: newValue }));
  };

  // Add product to task (edit mode) or to temp list (create mode)
  const handleAddProduct = async (product: HomeDepotProduct) => {
    const quantity = getQuantity(product.id);

    // Create mode: add to temporary materials list
    if (mode === "create") {
      // Check if product already in temp list
      const existing = tempMaterials.find(m => m.product_id === product.id);
      if (existing) {
        toast({
          title: "Material Already Added",
          description: `${product.name} is already in your selection`,
          variant: "destructive",
        });
        return;
      }

      const tempMaterial: TempMaterial = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        quantity,
        unit_of_measure: product.unitOfMeasure,
        image_url: product.imageUrl,
        stock_status: product.stockStatus,
      };

      onTempMaterialAdd?.(tempMaterial);

      // Reset quantity for this product
      setQuantities(prev => {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      });

      toast({
        title: "Material Selected",
        description: `Added ${quantity}x ${product.name} to your selection`,
      });

      return;
    }

    // Edit mode: add directly to task
    if (!taskId) {
      toast({
        title: "Error",
        description: "Task ID is required",
        variant: "destructive",
      });
      return;
    }

    setAddingProductId(product.id);

    const result = await addProductToTask(product, taskId, projectId, quantity);

    if (result.success) {
      toast({
        title: "Material Added",
        description: `Added ${quantity}x ${product.name} to task`,
      });
      // Reset quantity for this product
      setQuantities(prev => {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      });
      onMaterialAdded();
    } else {
      const errorMessage = "error" in result ? result.error : "An error occurred";
      toast({
        title: "Failed to Add Material",
        description: errorMessage || "An error occurred",
        variant: "destructive",
      });
    }

    setAddingProductId(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search Home Depot products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 border-2 focus:border-construction-blue"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-construction-blue" />
        )}
      </div>

      {/* Search Results */}
      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => {
            const stockConfig = STOCK_STATUS_CONFIG[product.stockStatus] || STOCK_STATUS_CONFIG.in_stock;
            const isAdding = addingProductId === product.id;
            const quantity = getQuantity(product.id);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-construction-blue/50 hover:shadow-sm transition-all"
              >
                {/* Product Image */}
                <div className="shrink-0 w-14 h-14 rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-construction-blue line-clamp-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-black text-construction-blue">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs text-gray-500">
                      / {product.unitOfMeasure}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0 border", stockConfig.color)}
                    >
                      {stockConfig.label}
                    </Badge>
                  </div>
                  {product.sku && (
                    <p className="text-[10px] text-gray-500">SKU: {product.sku}</p>
                  )}
                </div>

                {/* Quantity & Add Controls */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-1 border-2 border-gray-200 rounded-md">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={isAdding || quantity <= 1}
                      className="p-1 hover:bg-gray-100 disabled:opacity-50 rounded-l"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                      disabled={isAdding}
                      className="w-10 h-6 text-center text-sm font-bold border-x-2 border-gray-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={isAdding}
                      className="p-1 hover:bg-gray-100 disabled:opacity-50 rounded-r"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Add Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddProduct(product)}
                    disabled={isAdding || product.stockStatus === "out_of_stock"}
                    className={cn(
                      "h-7 px-3 text-xs font-bold",
                      product.stockStatus === "out_of_stock"
                        ? "bg-gray-200 text-gray-500"
                        : "bg-construction-blue hover:bg-construction-blue/90 text-white"
                    )}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State - No Search */}
        {!hasSearched && products.length === 0 && !isSearching && (
          <div className="py-8 text-center">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Search for Materials</p>
            <p className="text-xs text-gray-500 mt-1">
              Enter a product name to search Home Depot catalog
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {hasSearched && products.length === 0 && !isSearching && (
          <div className="py-8 text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">No Products Found</p>
            <p className="text-xs text-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && products.length === 0 && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 text-construction-blue mx-auto mb-3 animate-spin" />
            <p className="text-sm font-semibold text-gray-600">Searching Home Depot...</p>
          </div>
        )}
      </div>
    </div>
  );
}
