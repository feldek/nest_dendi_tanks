import Joi from 'joi';
import { ACTIONS, ISchema } from 'src/interfaces/ws';

const defaultState = {
  tank: {
    state: Joi.string().valid('stay', 'move', 'hold').default('stay'),
    direction: Joi.string().valid('right', 'left', 'up', 'down').default('up'),
    armor: Joi.number().default(4),
    speed: Joi.number().default(40),
    currentArmor: Joi.number().default(4),
    x: Joi.number().default(20),
    y: Joi.number().default(20),
  },
};

export const joiSchema = {
  [ACTIONS.TEST]: Joi.object<ISchema[ACTIONS.TEST]>({
    email: Joi.string().email().required().example('Test_UserName'),
    password: Joi.string().min(4).required().example('Test_password'),
  }),
  [ACTIONS.AUTHENTICATED]: Joi.object<ISchema[ACTIONS.AUTHENTICATED]>({
    token: Joi.string()
      .required()
      .example(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJ1c2VyUm9sZXMiOlsidXNlciJdLCJpYXQiOjE2NjgxMjEyNDMsImV4cCI6MTY2ODEzMjA0M30.EmMc2QNH9Kx4CdCs8-Bh-w9eyM_O_INObsdZNkekPLw',
      ),
  }),
  [ACTIONS.CREATE_NEW_GAME]: Joi.object<ISchema[ACTIONS.CREATE_NEW_GAME]>({
    teamId: Joi.string().required().example('Test_UserName'),
    ...defaultState.tank,
  }),
  [ACTIONS.JOIN_TO_GAME]: Joi.object<ISchema[ACTIONS.JOIN_TO_GAME]>({
    gameId: Joi.number().required().example(1),
    teamId: Joi.string().required().example('Test_UserName'),
    ...defaultState.tank,
  }),
  [ACTIONS.FORCE_END_GAME]: Joi.object<ISchema[ACTIONS.FORCE_END_GAME]>({
    gameId: Joi.number().required().example(1),
  }),
  [ACTIONS.TANK_MOVEMENT]: Joi.object<ISchema[ACTIONS.TANK_MOVEMENT]>({
    state: Joi.string().valid('stay', 'move', 'hold').example('stay'),
    direction: Joi.string().valid('right', 'left', 'up', 'down').example('up'),
  }),
  [ACTIONS.PAUSE_GAME]: Joi.object<ISchema[ACTIONS.PAUSE_GAME]>({
    pause: Joi.boolean().required().example(false),
  }),
};
