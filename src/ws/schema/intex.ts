import Joi from 'joi';
import { ACTIONS } from 'src/interfaces/ws';
import { TGameId } from '../game/gameSessions.class';
import { ITankClass, TTankControl } from '../game/tank/tank.class';

export interface IJoi {
  [ACTIONS.TEST]: { email: string; password: string };
  [ACTIONS.AUTHENTICATED]: { token: string };
  [ACTIONS.CREATE_NEW_GAME]: Omit<ITankClass, 'ws' | 'userId'>;
  [ACTIONS.JOIN_TO_GAME]: Omit<ITankClass, 'ws' | 'userId'> & { gameId: TGameId };
  [ACTIONS.FORCE_END_GAME]: { gameId: TGameId };
  [ACTIONS.TANK_MOVEMENT]: TTankControl;
}

export const joiSchema = {
  [ACTIONS.TEST]: Joi.object<IJoi[ACTIONS.TEST]>({
    email: Joi.string().email().required().example('Test_UserName'),
    password: Joi.string().min(4).required().example('Test_password'),
  }),
  [ACTIONS.AUTHENTICATED]: Joi.object<IJoi[ACTIONS.AUTHENTICATED]>({
    token: Joi.string()
      .required()
      .example(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJ1c2VyUm9sZXMiOlsidXNlciJdLCJpYXQiOjE2NjgxMjEyNDMsImV4cCI6MTY2ODEzMjA0M30.EmMc2QNH9Kx4CdCs8-Bh-w9eyM_O_INObsdZNkekPLw',
      ),
  }),
  [ACTIONS.CREATE_NEW_GAME]: Joi.object<IJoi[ACTIONS.CREATE_NEW_GAME]>({
    teamId: Joi.string().required().example('Test_UserName'),
    state: Joi.string().valid('stay', 'move', 'hold').default('stay'),
    armor: Joi.number().default(4),
    currentArmor: Joi.number().default(4),
  }),
  [ACTIONS.CREATE_NEW_GAME]: Joi.object<IJoi[ACTIONS.JOIN_TO_GAME]>({
    gameId: Joi.number().required().example(1),
    teamId: Joi.string().required().example('Test_UserName'),
    state: Joi.string().valid('stay', 'move', 'hold').default('stay'),
    armor: Joi.number().default(4),
    currentArmor: Joi.number().default(4),
  }),
  [ACTIONS.FORCE_END_GAME]: Joi.object<IJoi[ACTIONS.FORCE_END_GAME]>({
    gameId: Joi.number().required().example(1),
  }),
  [ACTIONS.TANK_MOVEMENT]: Joi.object<IJoi[ACTIONS.TANK_MOVEMENT]>({
    state: Joi.string().valid('stay', 'move', 'hold').example('stay'),
    direction: Joi.string().valid('right', 'left', 'up', 'down').example('up'),
  }),
};
