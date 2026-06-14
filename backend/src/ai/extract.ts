import OpenAI from 'openai';
import { query } from '../db/connection';
import { v4 as uuid } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  requires_review: boolean;
}

const FIELD_SCHEMA = {
  service: { label: 'Serviço executado', min_confidence: 85 },
  team: { label: 'Equipe alocada', min_confidence: 85 },
  weather: { label: 'Condição climática', min_confidence: 85 },
  materials: { label: 'Materiais utilizados', min_confidence: 80 },
  equipment: { label: 'Equipamentos em uso', min_confidence: 80 },
  occurrences: { label: 'Ocorrências relevantes', min_confidence: 75 },
  measurements: { label: 'Medições/quantidades', min_confidence: 70 },
};

const EXTRACT_PROMPT = `Você é um especialista em construção civil. Analise o texto do RDO (Registro Diário de Obra) e extraia os campos estruturados.

Para cada campo, retorne:
- field_name: nome do campo
- value: valor extraído
- confidence: número de 0 a 100 representando sua confiança na extração
- requires_review: booleano, true se confidence < limiar do campo

Campos para extrair:
${Object.entries(FIELD_SCHEMA).map(([key, f]) => `- ${key}: ${f.label} (confiança mínima: ${f.min_confidence}%)`).join('\n')}

Regras:
1. Se não encontrar informação para um campo, retorne confidence = 0 e value = "não informado"
2. Para confidence < limiar do campo, requires_review = true
3. Seja conservador na confiança — é melhor obrigar revisão do que alucinar
4. Retorne APENAS um array JSON válido, sem texto adicional

Exemplo:
[
  {"field_name": "service", "value": "Concretagem de Laje L02", "confidence": 98, "requires_review": false}
]`;

export async function extractFields(
  rdoId: string,
  text: string,
): Promise<ExtractedField[]> {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: `RDO para analisar:\n\n${text}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const parsed = JSON.parse(content);
    const fields: ExtractedField[] = Array.isArray(parsed)
      ? parsed
      : parsed.fields || [];

    // Save to database
    const avgConfidence = fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
    await query(
      `UPDATE rdo SET confidence_avg = $1, status = 'processing', updated_at = NOW() WHERE id_rdo = $2`,
      [Math.round(avgConfidence * 100) / 100, rdoId],
    );

    for (const field of fields) {
      await query(
        `INSERT INTO ai_confidence (id_ai_log, id_rdo, field_name, extracted_value, confidence, model)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuid(), rdoId, field.field_name, field.value, field.confidence, process.env.OPENAI_MODEL || 'gpt-4o-mini'],
      );
    }

    return fields;
  } catch (err) {
    console.error('[AI] Extraction error:', err);
    return [];
  }
}
