import { Request, Response } from 'express';
import { ExchangeService } from '../services/exchangeService';

// Interfaz para Request con usuario autenticado
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export class ExchangeController {
  // GET /api/exchanges - Obtener historial de intercambios del usuario autenticado
  static async getUserExchanges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = '50', offset = '0' } = req.query;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      const exchanges = await ExchangeService.getUserExchanges(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        exchanges,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: exchanges.length
        }
      });
    } catch (error: any) {
      console.error('Error en getUserExchanges:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // GET /api/exchanges/sent - Intercambios enviados por el usuario
  static async getSentExchanges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = '50', offset = '0' } = req.query;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      // Usar una consulta personalizada para intercambios enviados
      const exchanges = await ExchangeService.getUserSentExchanges(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        exchanges,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: exchanges.length
        }
      });
    } catch (error: any) {
      console.error('Error en getSentExchanges:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // GET /api/exchanges/received - Intercambios recibidos por el usuario
  static async getReceivedExchanges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = '50', offset = '0' } = req.query;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      // Usar una consulta personalizada para intercambios recibidos
      const exchanges = await ExchangeService.getUserReceivedExchanges(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        exchanges,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: exchanges.length
        }
      });
    } catch (error: any) {
      console.error('Error en getReceivedExchanges:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // GET /api/exchanges/:id - Obtener intercambio específico
  static async getExchangeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'ID de intercambio requerido'
        });
        return;
      }

      const exchange = await ExchangeService.getExchangeById(parseInt(id));

      if (!exchange) {
        res.status(404).json({
          error: 'Intercambio no encontrado'
        });
        return;
      }

      // Verificar que el usuario tenga acceso a este intercambio
      if (exchange.from_user_id !== userId && exchange.to_user_id !== userId) {
        res.status(403).json({
          error: 'No tienes permisos para ver este intercambio'
        });
        return;
      }

      res.status(200).json({
        exchange
      });
    } catch (error: any) {
      console.error('Error en getExchangeById:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // POST /api/exchanges - Crear nuevo intercambio
  static async createExchange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { toUserId, fromCurrencyId, toCurrencyId, fromAmount } = req.body;
      const fromUserId = req.user?.id;

      if (!fromUserId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      // Validaciones ya manejadas por el middleware validateExchange.create
      const exchange = await ExchangeService.createExchange({
        fromUserId,
        toUserId: parseInt(toUserId),
        fromCurrencyId: parseInt(fromCurrencyId),
        toCurrencyId: parseInt(toCurrencyId),
        fromAmount: parseFloat(fromAmount)
      });

      res.status(201).json({
        message: 'Intercambio creado exitosamente',
        exchange
      });
    } catch (error: any) {
      console.error('Error en createExchange:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // PUT /api/exchanges/:id/status - Actualizar estado del intercambio
  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      const exchangeId = parseInt(id);

      // Verificar que el intercambio existe y el usuario tiene permisos
      const exchange = await ExchangeService.getExchangeById(exchangeId);
      if (!exchange) {
        res.status(404).json({
          error: 'Intercambio no encontrado'
        });
        return;
      }

      if (exchange.from_user_id !== userId && exchange.to_user_id !== userId) {
        res.status(403).json({
          error: 'No tienes permisos para modificar este intercambio'
        });
        return;
      }

      let updatedExchange;

      switch (status) {
        case 'completed':
          // Solo el usuario destinatario puede completar el intercambio
          if (exchange.to_user_id !== userId) {
            res.status(403).json({
              error: 'Solo el usuario destinatario puede aceptar el intercambio'
            });
            return;
          }
          updatedExchange = await ExchangeService.processExchange(exchangeId);
          break;

        case 'failed':
          // Ambos usuarios pueden cancelar
          updatedExchange = await ExchangeService.cancelExchange(exchangeId, userId);
          break;

        default:
          res.status(400).json({
            error: 'Estado inválido. Valores permitidos: completed, failed'
          });
          return;
      }

      res.status(200).json({
        message: 'Estado del intercambio actualizado exitosamente',
        exchange: updatedExchange
      });
    } catch (error: any) {
      console.error('Error en updateStatus:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // POST /api/exchanges/:id/accept - Aceptar intercambio
  static async acceptExchange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      const exchangeId = parseInt(id);

      // Verificar que el intercambio existe
      const exchange = await ExchangeService.getExchangeById(exchangeId);
      if (!exchange) {
        res.status(404).json({
          error: 'Intercambio no encontrado'
        });
        return;
      }

      // Solo el usuario destinatario puede aceptar
      if (exchange.to_user_id !== userId) {
        res.status(403).json({
          error: 'Solo el usuario destinatario puede aceptar el intercambio'
        });
        return;
      }

      if (exchange.status !== 'pending') {
        res.status(400).json({
          error: 'Solo se pueden aceptar intercambios pendientes'
        });
        return;
      }

      const processedExchange = await ExchangeService.processExchange(exchangeId);

      res.status(200).json({
        message: 'Intercambio aceptado y procesado exitosamente',
        exchange: processedExchange
      });
    } catch (error: any) {
      console.error('Error en acceptExchange:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // POST /api/exchanges/:id/reject - Rechazar intercambio
  static async rejectExchange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado'
        });
        return;
      }

      const exchangeId = parseInt(id);

      // Verificar que el intercambio existe
      const exchange = await ExchangeService.getExchangeById(exchangeId);
      if (!exchange) {
        res.status(404).json({
          error: 'Intercambio no encontrado'
        });
        return;
      }

      // Solo el usuario destinatario puede rechazar
      if (exchange.to_user_id !== userId) {
        res.status(403).json({
          error: 'Solo el usuario destinatario puede rechazar el intercambio'
        });
        return;
      }

      if (exchange.status !== 'pending') {
        res.status(400).json({
          error: 'Solo se pueden rechazar intercambios pendientes'
        });
        return;
      }

      const cancelledExchange = await ExchangeService.cancelExchange(exchangeId, userId);

      res.status(200).json({
        message: 'Intercambio rechazado exitosamente',
        exchange: cancelledExchange
      });
    } catch (error: any) {
      console.error('Error en rejectExchange:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
}