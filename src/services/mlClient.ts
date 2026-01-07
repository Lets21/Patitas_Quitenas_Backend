import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export async function predictAdoptionPropensity(featurePayload: Record<string, any>) {
  const url = `${ML_SERVICE_URL}/predict`;
  const { data } = await axios.post(url, featurePayload, { timeout: 8000 });
  
  // El ML service ya corrige la inversión internamente
  // Aquí solo validamos coherencia y retornamos los datos
  console.log("📊 DATOS DEL ML SERVICE (ya corregidos):");
  console.log(`   pred: ${data.pred}`);
  console.log(`   proba: ${data.proba_adopta_1 !== null ? (data.proba_adopta_1 * 100).toFixed(1) : 'N/A'}%`);
  if (data.explanation) {
    console.log(`   Vecinos adoptados: ${data.explanation.adopted_neighbors}`);
    console.log(`   Vecinos NO adoptados: ${data.explanation.not_adopted_neighbors}`);
    const porcentaje = (data.explanation.adopted_neighbors / 15 * 100).toFixed(1);
    const coherente = Math.abs(Number(porcentaje) - (data.proba_adopta_1 || 0) * 100) < 20;
    console.log(`   Coherencia: ${coherente ? '✅' : '⚠️'} (${porcentaje}% vs ${((data.proba_adopta_1 || 0) * 100).toFixed(1)}%)`);
  }
  
  return { 
    pred: data.pred, 
    proba_adopta_1: data.proba_adopta_1,
    explanation: data.explanation || null
  } as { 
    pred: number; 
    proba_adopta_1: number | null;
    explanation: any;
  };
}
