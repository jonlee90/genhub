import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  coverPage: {
    padding: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#001B51",
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 18,
    color: "#3C3C3C",
    marginBottom: 40,
  },
  coverInfo: {
    fontSize: 12,
    color: "#3C3C3C",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  coverDate: {
    fontSize: 10,
    color: "#666666",
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "2 solid #001B51",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#001B51",
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: "#3C3C3C",
    marginBottom: 2,
  },
  headerText: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#001B51",
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: "1 solid #E5E7EB",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryCard: {
    width: "23%",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
    border: "1 solid #E5E7EB",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#001B51",
  },
  summaryPercentage: {
    fontSize: 8,
    color: "#999999",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: 8,
    fontWeight: "bold",
    fontSize: 9,
    borderBottom: "1 solid #D1D5DB",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1 solid #E5E7EB",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderBottom: "1 solid #E5E7EB",
  },
  col1: { width: "30%", fontSize: 9 },
  col2: { width: "35%", fontSize: 9 },
  col3: { width: "10%", fontSize: 9, textAlign: "right" },
  col4: { width: "10%", fontSize: 9, textAlign: "right" },
  col5: { width: "15%", fontSize: 9, textAlign: "right", fontWeight: "bold" },
  tradeSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  tradeHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#001B51",
    backgroundColor: "#EFF6FF",
    padding: 8,
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999999",
    borderTop: "1 solid #E5E7EB",
    paddingTop: 8,
  },
  watermark: {
    fontSize: 8,
    color: "#CCCCCC",
  },
  pageNumber: {
    fontSize: 8,
    color: "#666666",
  },
  planThumbnail: {
    width: "30%",
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    objectFit: "cover",
    border: "1 solid #E5E7EB",
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  notesBox: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderLeft: "3 solid #001B51",
    marginTop: 10,
  },
  notesText: {
    fontSize: 9,
    color: "#3C3C3C",
    lineHeight: 1.4,
  },
});

type EstimatePdfDocumentProps = {
  estimate: any;
  lineItems: any[];
  company: any;
  project: any;
  createdBy: any;
  options: {
    detailLevel: "summary" | "detailed";
    includePlans: boolean;
    planPages: Array<{ pageNumber: number; url: string | null }>;
  };
};

export function EstimatePdfDocument({
  estimate,
  lineItems,
  company,
  project,
  createdBy,
  options,
}: EstimatePdfDocumentProps) {
  // Group line items by trade
  const groupedByTrade = lineItems.reduce(
    (acc, item) => {
      const trade = item.trade || "Other";
      if (!acc[trade]) {
        acc[trade] = [];
      }
      acc[trade].push(item);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // Calculate trade totals for executive summary
  const tradeTotals = (Object.entries(groupedByTrade) as [string, any[]][]).map(
    ([trade, items]) => ({
      trade,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
      itemCount: items.length,
    }),
  );

  // Calculate cost breakdown
  const materialCost = lineItems.reduce(
    (sum, item) => sum + (item.material_cost || 0),
    0,
  );
  const laborCost = lineItems.reduce(
    (sum, item) => sum + (item.labor_cost || 0),
    0,
  );
  const equipmentCost = lineItems.reduce(
    (sum, item) => sum + (item.equipment_cost || 0),
    0,
  );

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          {company.logo_url ? (
            <Image src={company.logo_url} style={styles.logo} />
          ) : null}

          <Text style={styles.coverTitle}>Construction Estimate</Text>
          <Text style={styles.coverSubtitle}>{estimate.name}</Text>

          <View style={{ marginTop: 40 }}>
            <Text style={styles.coverInfo}>
              Project: {project.name || "Untitled Project"}
            </Text>
            {project.address ? (
              <Text style={styles.coverInfo}>
                Location: {project.address}
                {project.city ? `, ${project.city}` : ""}
                {project.state ? `, ${project.state}` : ""}
              </Text>
            ) : null}
            <Text style={styles.coverInfo}>
              Prepared by: {createdBy?.name || "Unknown"}
            </Text>
            {createdBy?.email ? (
              <Text style={styles.coverInfo}>Email: {createdBy.email}</Text>
            ) : null}
            <Text style={styles.coverDate}>
              Date: {formatDate(estimate.created_at)}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.watermark}>CONFIDENTIAL</Text>
          <Text style={styles.headerText}>
            This estimate is valid for 30 days from the date of issue.
          </Text>
        </View>
      </Page>

      {/* Executive Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.projectName}>{project.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerText}>Estimate: {estimate.name}</Text>
            <Text style={styles.headerText}>
              Date: {formatDate(estimate.created_at)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>

        {/* Cost Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Material Costs</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(materialCost)}
            </Text>
            <Text style={styles.summaryPercentage}>
              {((materialCost / estimate.subtotal) * 100).toFixed(1)}% of total
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Labor Costs</Text>
            <Text style={styles.summaryValue}>{formatCurrency(laborCost)}</Text>
            <Text style={styles.summaryPercentage}>
              {((laborCost / estimate.subtotal) * 100).toFixed(1)}% of total
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Equipment Costs</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(equipmentCost)}
            </Text>
            <Text style={styles.summaryPercentage}>
              {((equipmentCost / estimate.subtotal) * 100).toFixed(1)}% of total
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#EFF6FF", borderColor: "#001B51" },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: "#001B51" }]}>
              Grand Total
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(estimate.grand_total)}
            </Text>
            <Text style={[styles.summaryPercentage, { color: "#001B51" }]}>
              {estimate.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Trade Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Breakdown by Trade</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "50%" }}>Trade</Text>
              <Text style={{ width: "20%", textAlign: "right" }}>Items</Text>
              <Text style={{ width: "30%", textAlign: "right" }}>Total</Text>
            </View>
            {tradeTotals.map((trade, index) => (
              <View
                key={trade.trade}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={{ width: "50%" }}>{trade.trade}</Text>
                <Text style={{ width: "20%", textAlign: "right" }}>
                  {trade.itemCount}
                </Text>
                <Text style={{ width: "30%", textAlign: "right" }}>
                  {formatCurrency(trade.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              Subtotal: {formatCurrency(estimate.subtotal)}
            </Text>
            <Text style={styles.notesText}>
              Overhead ({estimate.overhead_pct}%):{" "}
              {formatCurrency(estimate.overhead_amount)}
            </Text>
            <Text style={styles.notesText}>
              Markup ({estimate.markup_pct}%):{" "}
              {formatCurrency(estimate.markup_amount)}
            </Text>
            <Text style={[styles.notesText, { fontWeight: "bold" }]}>
              Grand Total: {formatCurrency(estimate.grand_total)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {estimate.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{estimate.description}</Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.watermark}>{company.name} - CONFIDENTIAL</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Detailed Line Items Pages (if detailed mode) */}
      {options.detailLevel === "detailed" ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.projectName}>{project.name}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerText}>Estimate: {estimate.name}</Text>
              <Text style={styles.headerText}>Detailed Line Items</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Detailed Cost Breakdown</Text>

          {(Object.entries(groupedByTrade) as [string, any[]][]).map(
            ([trade, items]) => (
              <View key={trade} style={styles.section} wrap={false}>
                <Text style={styles.tradeHeader}>
                  {trade} (
                  {formatCurrency(
                    items.reduce((sum, item) => sum + item.subtotal, 0),
                  )}
                  )
                </Text>

                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.col1}>Item</Text>
                    <Text style={styles.col2}>Description</Text>
                    <Text style={styles.col3}>Qty</Text>
                    <Text style={styles.col4}>Unit Price</Text>
                    <Text style={styles.col5}>Subtotal</Text>
                  </View>

                  {items.map((item, index) => (
                    <View
                      key={item.id}
                      style={
                        index % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                      }
                    >
                      <Text style={styles.col1}>{item.sub_type}</Text>
                      <Text style={styles.col2}>
                        {item.description || item.sub_type}
                      </Text>
                      <Text style={styles.col3}>
                        {item.quantity} {item.unit}
                      </Text>
                      <Text style={styles.col4}>
                        {formatCurrency(item.unit_cost)}
                      </Text>
                      <Text style={styles.col5}>
                        {formatCurrency(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ),
          )}

          <View style={styles.footer} fixed>
            <Text style={styles.watermark}>{company.name} - CONFIDENTIAL</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      ) : null}

      {/* Plan Thumbnails Page (if includePlans is true and planPages exist) */}
      {options.includePlans && options.planPages.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.projectName}>{project.name}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerText}>Estimate: {estimate.name}</Text>
              <Text style={styles.headerText}>Referenced Plans</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Referenced Plan Pages</Text>

          <View style={styles.planGrid}>
            {options.planPages.map((page) =>
              page.url ? (
                <View
                  key={page.pageNumber}
                  style={{ width: "30%", marginRight: "3%", marginBottom: 10 }}
                >
                  <Image src={page.url} style={styles.planThumbnail} />
                  <Text
                    style={{ fontSize: 8, textAlign: "center", marginTop: 4 }}
                  >
                    Page {page.pageNumber}
                  </Text>
                </View>
              ) : null,
            )}
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.watermark}>{company.name} - CONFIDENTIAL</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      ) : null}
    </Document>
  );
}
