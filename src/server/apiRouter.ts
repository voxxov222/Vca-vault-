import { Router, Request, Response } from 'express';
import {
  recognizeCardFromFrame,
  searchPokemonCards,
  getCardById,
  computeCardPricing,
} from './cardService.ts';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Live camera frame recognition using Gemini Vision
apiRouter.post('/recognize-card', async (req: Request, res: Response) => {
  try {
    const { imageBase64, language = 'EN' } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const result = await recognizeCardFromFrame(imageBase64, language);
    res.json(result);
  } catch (error: any) {
    console.error('API /recognize-card error:', error);
    res.status(500).json({ error: error?.message || 'Card recognition failed' });
  }
});

// Search Pokémon TCG cards
apiRouter.get('/cards/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const language = (req.query.language as string) || 'EN';

    if (!q) {
      res.json({ data: [] });
      return;
    }

    const cards = await searchPokemonCards(q, language);
    res.json({ data: cards });
  } catch (error: any) {
    console.error('API /cards/search error:', error);
    res.status(500).json({ error: error?.message || 'Search failed' });
  }
});

// Compute live pricing for custom variant (must precede /cards/:id)
apiRouter.get('/cards/pricing', async (req: Request, res: Response) => {
  try {
    const cardId = req.query.cardId as string;
    const variant = (req.query.variant as string) || 'Normal';

    let card = null;
    if (cardId) {
      card = await getCardById(cardId);
    }

    const pricing = computeCardPricing(card, variant);
    res.json({ pricing });
  } catch (error: any) {
    console.error('API /cards/pricing error:', error);
    res.status(500).json({ error: error?.message || 'Failed to compute pricing' });
  }
});

// Get card details and live pricing
apiRouter.get('/cards/:id', async (req: Request, res: Response) => {
  try {
    const cardId = req.params.id;
    const variant = (req.query.variant as string) || 'Normal';

    const card = await getCardById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const pricing = computeCardPricing(card, variant);
    res.json({ data: card, pricing });
  } catch (error: any) {
    console.error('API /cards/:id error:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch card' });
  }
});
