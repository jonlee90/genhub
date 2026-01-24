"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignMaterialModal } from "./AssignMaterialModal";
import Image from "next/image";
import type { HomeDepotProduct } from "@/lib/services/home-depot-api";

interface Project {
  id: string;
  name: string;
}

interface ProductComparisonModalProps {
  products: HomeDepotProduct[];
  projects: Project[];
  onClose: () => void;
  onClearSelection: () => void;
}

const STOCK_STATUS_CONFIG = {
  in_stock: {
    label: "In Stock",
    icon: CheckCircle2,
    color:
      "bg-construction-green/10 text-construction-green border-construction-green",
  },
  low_stock: {
    label: "Low Stock",
    icon: AlertCircle,
    color:
      "bg-construction-accent/10 text-construction-accent border-construction-accent",
  },
  out_of_stock: {
    label: "Out of Stock",
    icon: XCircle,
    color:
      "bg-construction-red/10 text-construction-red border-construction-red",
  },
  special_order: {
    label: "Special Order",
    icon: AlertCircle,
    color:
      "bg-construction-accent/10 text-construction-accent border-construction-accent",
  },
};

export function ProductComparisonModal({
  products,
  projects,
  onClose,
  onClearSelection,
}: ProductComparisonModalProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<HomeDepotProduct | null>(null);

  const formatPrice = (price: number) => priceFormatter.format(price);

  // Find lowest and highest prices
  const prices = products.map((p) => p.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return (
    <>
      <ResponsiveModal
        isOpen={true}
        onClose={onClose}
        icon={BarChart}
        title="Product Comparison"
        maxWidth="4xl"
        showNavigation={true}
        onBack={() => {
          onClearSelection();
          onClose();
        }}
        backLabel="Clear Selection"
      >
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))`,
          }}
        >
          {products.map((product) => {
            const stockConfig = STOCK_STATUS_CONFIG[product.stockStatus];
            const StockIcon = stockConfig.icon;
            const isLowestPrice =
              product.price === lowestPrice && products.length > 1;
            const isHighestPrice =
              product.price === highestPrice &&
              products.length > 1 &&
              lowestPrice !== highestPrice;

            return (
              <div key={product.id} className="space-y-4">
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-20 w-20 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-3">
                  {/* Category */}
                  <Badge
                    variant="outline"
                    className="font-semibold capitalize text-xs"
                  >
                    {product.category}
                  </Badge>

                  {/* Product Name */}
                  <h3 className="font-bold text-sm text-construction-blue min-h-[3rem]">
                    {product.name}
                  </h3>

                  {/* SKU */}
                  <p className="text-xs text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>

                  {/* Stock Status */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold border-2 w-full justify-center",
                      stockConfig.color,
                    )}
                  >
                    <StockIcon className="h-3 w-3 mr-1" />
                    {stockConfig.label}
                  </Badge>

                  {/* Price */}
                  <div className="relative">
                    <div
                      className={cn(
                        "p-4 rounded-lg border-2",
                        isLowestPrice &&
                          "bg-construction-green/5 border-construction-green",
                        isHighestPrice &&
                          "bg-construction-red/5 border-construction-red",
                        !isLowestPrice &&
                          !isHighestPrice &&
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      )}
                    >
                      <div className="text-2xl font-black text-construction-blue">
                        {formatPrice(product.price)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">per unit</div>
                      {isLowestPrice && (
                        <Badge className="mt-2 bg-construction-green text-white font-bold">
                          Lowest Price
                        </Badge>
                      )}
                      {isHighestPrice && (
                        <Badge className="mt-2 bg-construction-red text-white font-bold">
                          Highest Price
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  {product.specifications &&
                    Object.keys(product.specifications).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                          Specifications
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(product.specifications)
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {key}:
                                </span>{" "}
                                <span className="text-gray-600 dark:text-gray-400">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Assign Button */}
                  <Button
                    onClick={() => setSelectedProduct(product)}
                    className="w-full bg-construction-green hover:bg-construction-green/90 text-white font-bold"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Assign to Task
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ResponsiveModal>

      {/* Assign Material Modal */}
      {selectedProduct && (
        <AssignMaterialModal
          product={selectedProduct}
          projects={projects}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
