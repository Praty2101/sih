import { Request, Response } from 'express';
import { gpsTracks } from '../utils/gps';

export async function getGPSTrack(req: Request, res: Response) {
  const { deviceId } = req.params;
  const track = gpsTracks[deviceId];

  if (!track) {
    return res.status(404).json({ error: 'Device not found' });
  }

  res.json(track);
}


