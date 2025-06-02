import { Request, Response } from 'express';
import Service from '../models/service';
import Restaurant from '../models/restraunt';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: {
    _id: string;
    restaurantId: string;
    role: string;
  };
}

export class ServiceController {
  // Get all service requests for a restaurant
  static async getServiceRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const { status } = req.query;
      
      // Verify user has access to this restaurant
      if (req.user.restaurantId !== restaurantId && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      const filter: any = { restaurantId };
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      const requests = await Service.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('assignedTo', 'name email');
      
      res.json({ requests });
    } catch (error) {
      logger.error('Error fetching service requests:', error);
      res.status(500).json({ error: 'Failed to fetch service requests' });
    }
  }

  // Create a new service request (from customer)
  static async requestService(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId, requests, timestamp } = req.body;
      
      if (!restaurantId || !tableId || !requests || !Array.isArray(requests)) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Verify restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Create individual service requests
      const serviceRequests = await Promise.all(
        requests.map(async (request: any) => {
          const serviceRequest = new Service({
            restaurantId,
            tableId,
            serviceType: 'special_request',
            category: request.category,
            title: request.title,
            details: {
              selectedOptions: request.selectedOptions || [],
              note: request.note || '',
              requestId: request.id
            },
            status: 'pending',
            priority: request.category === 'dietary' ? 'high' : 'medium',
            createdAt: new Date(timestamp || Date.now())
          });
          
          return await serviceRequest.save();
        })
      );
      
      logger.info(`${serviceRequests.length} special requests created for table ${tableId}`);
      
      res.status(201).json({ 
        message: 'Special requests submitted successfully',
        requests: serviceRequests 
      });
    } catch (error) {
      logger.error('Error creating service request:', error);
      res.status(500).json({ error: 'Failed to submit special requests' });
    }
  }

  // Update service request status (admin/staff)
  static async updateServiceRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { status, notes, assignedTo } = req.body;
      
      const request = await Service.findById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Service request not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user.restaurantId !== request.restaurantId.toString() && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (notes) updateData.adminNotes = notes;
      if (assignedTo) updateData.assignedTo = assignedTo;
      
      const updatedRequest = await Service.findByIdAndUpdate(
        requestId,
        updateData,
        { new: true }
      ).populate('assignedTo', 'name email');
      
      res.json({ request: updatedRequest });
    } catch (error) {
      logger.error('Error updating service request:', error);
      res.status(500).json({ error: 'Failed to update service request' });
    }
  }

  // Call server (legacy support)
  static async callServer(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId, message } = req.body;
      
      const serviceRequest = new Service({
        restaurantId,
        tableId,
        serviceType: 'call_server',
        title: 'Server Assistance',
        details: { message: message || 'Customer needs assistance' },
        status: 'pending',
        priority: 'high'
      });
      
      await serviceRequest.save();
      
      res.status(201).json({ 
        message: 'Server called successfully',
        request: serviceRequest 
      });
    } catch (error) {
      logger.error('Error calling server:', error);
      res.status(500).json({ error: 'Failed to call server' });
    }
  }

  // Submit special instructions
  static async submitSpecialInstructions(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId, ...instructionData } = req.body;
      
      const serviceRequest = new Service({
        restaurantId,
        tableId,
        serviceType: 'special_instructions',
        title: 'Special Instructions',
        details: instructionData,
        status: 'pending',
        priority: 'medium'
      });
      
      await serviceRequest.save();
      
      res.status(201).json({ 
        message: 'Special instructions submitted successfully',
        request: serviceRequest 
      });
    } catch (error) {
      logger.error('Error submitting special instructions:', error);
      res.status(500).json({ error: 'Failed to submit special instructions' });
    }
  }

  // Get service request statistics
  static async getServiceStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      
      if (req.user.restaurantId !== restaurantId && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const stats = await Service.aggregate([
        { $match: { restaurantId: req.user.restaurantId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const categoryStats = await Service.aggregate([
        { $match: { restaurantId: req.user.restaurantId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({ stats, categoryStats });
    } catch (error) {
      logger.error('Error getting service stats:', error);
      res.status(500).json({ error: 'Failed to get service statistics' });
    }
  }
}