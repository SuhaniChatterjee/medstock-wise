import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting data seeding...");

    // Sample inventory items from the PDF
    const inventoryItems = [
      {
        item_name: "Ventilator",
        item_type: "Equipment",
        current_stock: 2487,
        min_required: 656,
        max_capacity: 3556,
        unit_cost: 5832.29,
        avg_usage_per_day: 55,
        restock_lead_time: 12,
        vendor_name: "MedSupply Inc"
      },
      {
        item_name: "Surgical Mask",
        item_type: "PPE",
        current_stock: 2371,
        min_required: 384,
        max_capacity: 5562,
        unit_cost: 16062.98,
        avg_usage_per_day: 470,
        restock_lead_time: 6,
        vendor_name: "HealthCare Supplies"
      },
      {
        item_name: "IV Drip",
        item_type: "Medical Supplies",
        current_stock: 2410,
        min_required: 338,
        max_capacity: 1013,
        unit_cost: 15426.53,
        avg_usage_per_day: 158,
        restock_lead_time: 12,
        vendor_name: "PharmaTech"
      },
      {
        item_name: "Surgical Gloves",
        item_type: "PPE",
        current_stock: 1542,
        min_required: 264,
        max_capacity: 1018,
        unit_cost: 4467.55,
        avg_usage_per_day: 108,
        restock_lead_time: 17,
        vendor_name: "MedSupply Inc"
      },
      {
        item_name: "Syringes",
        item_type: "Medical Supplies",
        current_stock: 2038,
        min_required: 438,
        max_capacity: 1131,
        unit_cost: 744.10,
        avg_usage_per_day: 207,
        restock_lead_time: 15,
        vendor_name: "HealthCare Supplies"
      },
      {
        item_name: "Bandages",
        item_type: "Medical Supplies",
        current_stock: 1850,
        min_required: 500,
        max_capacity: 2500,
        unit_cost: 125.50,
        avg_usage_per_day: 95,
        restock_lead_time: 10,
        vendor_name: "PharmaTech"
      },
      {
        item_name: "X-Ray Film",
        item_type: "Equipment",
        current_stock: 320,
        min_required: 150,
        max_capacity: 800,
        unit_cost: 2350.00,
        avg_usage_per_day: 12,
        restock_lead_time: 14,
        vendor_name: "MedSupply Inc"
      },
      {
        item_name: "Oxygen Tanks",
        item_type: "Equipment",
        current_stock: 180,
        min_required: 200,
        max_capacity: 500,
        unit_cost: 8500.00,
        avg_usage_per_day: 8,
        restock_lead_time: 20,
        vendor_name: "PharmaTech"
      }
    ];

    // Insert inventory items
    const { data: insertedItems, error: inventoryError } = await supabase
      .from("inventory_items")
      .upsert(inventoryItems, { onConflict: "item_name", ignoreDuplicates: false })
      .select();

    if (inventoryError) {
      console.error("Error inserting inventory:", inventoryError);
      throw inventoryError;
    }

    console.log(`Inserted ${insertedItems?.length} inventory items`);

    // Insert model registry entry (from PDF: Validation MAE: 215.72, Test MAE: 157.17)
    const { data: modelData, error: modelError } = await supabase
      .from("model_registry")
      .upsert({
        model_version: "v1.0.0",
        model_type: "GradientBoosting",
        mae: 157.17,
        rmse: 215.72,
        r2_score: 0.92,
        training_date: new Date().toISOString(),
        is_active: true,
        feature_importance: {
          "Avg_Usage_Per_Day": 0.45,
          "Restock_Lead_Time": 0.30,
          "Current_Stock": 0.15,
          "Unit_Cost": 0.10
        },
        hyperparameters: {
          "n_estimators": 100,
          "learning_rate": 0.1,
          "max_depth": 3,
          "random_state": 42
        },
        dataset_summary: {
          "total_samples": 500,
          "train_samples": 350,
          "val_samples": 75,
          "test_samples": 75
        }
      }, { onConflict: "model_version", ignoreDuplicates: false })
      .select()
      .single();

    if (modelError) {
      console.error("Error inserting model:", modelError);
      throw modelError;
    }

    console.log("Inserted model registry entry");

    // Create predictions for each item
    if (insertedItems && modelData) {
      const predictions = insertedItems.map((item) => {
        const estimatedDemand = item.avg_usage_per_day * item.restock_lead_time;
        const inventoryShortfall = Math.max(0, item.min_required - item.current_stock);
        const replenishmentNeeds = Math.max(0, item.max_capacity - item.current_stock);

        return {
          item_id: item.id,
          model_version_id: modelData.id,
          predicted_demand: estimatedDemand,
          confidence_score: 0.85 + Math.random() * 0.1,
          feature_values: {
            avg_usage_per_day: item.avg_usage_per_day,
            restock_lead_time: item.restock_lead_time,
            current_stock: item.current_stock,
            shortfall: inventoryShortfall,
            replenishment_needs: replenishmentNeeds,
            unit_cost: item.unit_cost
          },
          feature_contributions: [
            { name: "Avg_Usage_Per_Day", contribution: 45.0 },
            { name: "Restock_Lead_Time", contribution: 30.0 },
            { name: "Current_Stock", contribution: 15.0 }
          ]
        };
      });

      const { error: predictionError } = await supabase
        .from("prediction_history")
        .insert(predictions);

      if (predictionError) {
        console.error("Error inserting predictions:", predictionError);
        throw predictionError;
      }

      console.log(`Inserted ${predictions.length} predictions`);

      // Also insert into predictions table for dashboard
      const dashboardPredictions = insertedItems.map((item) => {
        const estimatedDemand = item.avg_usage_per_day * item.restock_lead_time;
        const inventoryShortfall = Math.max(0, item.min_required - item.current_stock);
        const replenishmentNeeds = Math.max(0, item.max_capacity - item.current_stock);

        return {
          item_id: item.id,
          estimated_demand: estimatedDemand,
          inventory_shortfall: inventoryShortfall,
          replenishment_needs: replenishmentNeeds
        };
      });

      const { error: dashPredError } = await supabase
        .from("predictions")
        .upsert(dashboardPredictions, { onConflict: "item_id", ignoreDuplicates: false });

      if (dashPredError) {
        console.error("Error inserting dashboard predictions:", dashPredError);
        throw dashPredError;
      }

      console.log(`Inserted ${dashboardPredictions.length} dashboard predictions`);
    }

    // Insert sample alerts
    const lowStockItems = insertedItems?.filter(item => item.current_stock < item.min_required) || [];
    
    if (lowStockItems.length > 0) {
      const alerts = lowStockItems.map((item) => ({
        alert_type: "low_stock",
        severity: item.current_stock < item.min_required * 0.5 ? "critical" : "warning",
        title: `Low Stock Alert: ${item.item_name}`,
        message: `${item.item_name} stock (${item.current_stock}) is below minimum required (${item.min_required})`,
        item_id: item.id,
        metadata: {
          current_stock: item.current_stock,
          min_required: item.min_required,
          shortfall: item.min_required - item.current_stock
        }
      }));

      const { error: alertError } = await supabase
        .from("alerts_history")
        .insert(alerts);

      if (alertError) {
        console.error("Error inserting alerts:", alertError);
        throw alertError;
      }

      console.log(`Inserted ${alerts.length} alerts`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sample data seeded successfully",
        stats: {
          inventory_items: insertedItems?.length || 0,
          predictions: insertedItems?.length || 0,
          alerts: lowStockItems.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
