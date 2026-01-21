"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STOCK_STATUS_CONFIG } from "@/lib/materials-ui";
import { m as motion } from "framer-motion";
import { AssignMaterialModal } from "./AssignMaterialModal";
import Image from "next/image";
import type { HomeDepotProduct } from "@/lib/services/home-depot-api";

interface Project {
  id: string;
  name: string;
}

interface ProductCardProps {
  product: HomeDepotProduct;
  projects: Project[];
  viewMode: "grid" | "list";
  isSelectedForComparison: boolean;
  onToggleComparison: (product: HomeDepotProduct) => void;
}

export function ProductCard({
  product,
  projects,
  viewMode,
  isSelectedForComparison,
  onToggleComparison,
}: ProductCardProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const stockConfig = STOCK_STATUS_CONFIG[product.stockStatus];
  const StockIcon = stockConfig.icon;

  const formatPrice = (price: number) => priceFormatter.format(price);

  if (viewMode === "list") {
    return (
      <>
        <Card
          className={cn(
            "p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-all cursor-pointer border-2",
            isSelectedForComparison &&
              "border-construction-blue bg-construction-blue/5 dark:bg-construction-blue/10",
          )}
        >
          <div className="flex items-center gap-4">
            {/* Product Image */}
            <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0 border-2 border-gray-200 dark:border-gray-600">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-construction-blue dark:text-blue-400 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    SKU: {product.sku}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge
                      variant="outline"
                      className="font-semibold capitalize"
                    >
                      {product.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold border-2",
                        stockConfig.color,
                      )}
                    >
                      <StockIcon className="h-3 w-3 mr-1" />
                      {stockConfig.label}
                    </Badge>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-construction-blue dark:text-blue-400">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">per unit</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant={isSelectedForComparison ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleComparison(product)}
                className={
                  isSelectedForComparison ? "bg-construction-blue dark:bg-blue-600" : ""
                }
              >
                {isSelectedForComparison ? "Selected" : "Compare"}
              </Button>
              <Button
                onClick={() => setShowAssignModal(true)}
                size="sm"
                className="bg-construction-green dark:bg-green-600 hover:bg-construction-green/90 dark:hover:bg-green-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign to Task
              </Button>
            </div>
          </div>
        </Card>

        {showAssignModal && (
          <AssignMaterialModal
            product={product}
            projects={projects}
            onClose={() => setShowAssignModal(false)}
          />
        )}
      </>
    );
  }

  // Grid view
  return (
    <>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card
          className={cn(
            "overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-all cursor-pointer border-2 group",
            isSelectedForComparison &&
              "border-construction-blue bg-construction-blue/5 dark:bg-construction-blue/10",
          )}
        >
          {/* Product Image */}
          <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-20 w-20 text-gray-400 dark:text-gray-500" />
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={cn("font-semibold border-2", stockConfig.color)}
              >
                <StockIcon className="h-3 w-3 mr-1" />
                {stockConfig.label}
              </Badge>
            </div>

            {/* Comparison Checkbox */}
            {isSelectedForComparison && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 left-2 bg-construction-blue dark:bg-blue-600 text-white p-2 rounded-lg shadow-lg"
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-3">
            {/* Category */}
            <Badge
              variant="outline"
              className="font-semibold capitalize text-xs"
            >
              {product.category}
            </Badge>

            {/* Product Name */}
            <h3 className="font-bold text-base text-construction-blue dark:text-blue-400 line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>

            {/* SKU */}
            <p className="text-xs text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>

            {/* Price */}
            <div className="pt-2 border-t-2 border-gray-100 dark:border-gray-700">
              <div className="text-2xl font-black text-construction-blue dark:text-blue-400">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">per unit</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleComparison(product)}
                className={cn(
                  "flex-1 font-semibold",
                  isSelectedForComparison &&
                    "bg-construction-blue dark:bg-blue-600 text-white border-construction-blue hover:bg-construction-blue/90 dark:hover:bg-blue-700",
                )}
              >
                {isSelectedForComparison ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Selected
                  </>
                ) : (
                  "Compare"
                )}
              </Button>
              <Button
                onClick={() => setShowAssignModal(true)}
                size="sm"
                className="flex-1 bg-construction-green dark:bg-green-600 hover:bg-construction-green/90 dark:hover:bg-green-700 text-white font-bold"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Assign
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {showAssignModal && (
        <AssignMaterialModal
          product={product}
          projects={projects}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </>
  );
}
