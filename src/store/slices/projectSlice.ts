import { type StateCreator } from 'zustand';
import type {
  EntityData,
  AnimationTrackData,
  Vector3Data,
  QuaternionData,
} from '../types';

export interface ProjectState {
  entities: Record<string, EntityData>;
  tracks: Record<string, AnimationTrackData>;
}

export interface ProjectActions {
  addEntity: (entity: EntityData) => void;
  removeEntity: (id: string) => void;
  updateEntityTransform: (
    id: string,
    position?: Vector3Data,
    rotation?: QuaternionData,
  ) => void;
}

export type ProjectSlice = ProjectState & ProjectActions;

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  entities: {},
  tracks: {},
  addEntity: (entity) =>
    set((state) => ({ entities: { ...state.entities, [entity.id]: entity } })),
  removeEntity: (id) =>
    set((state) => {
      const entities = { ...state.entities };
      delete entities[id];
      return { entities };
    }),
  updateEntityTransform: (id, position, rotation) =>
    set((state) => {
      if (!state.entities[id]) return state;
      return {
        entities: {
          ...state.entities,
          [id]: {
            ...state.entities[id],
            position: position ?? state.entities[id].position,
            rotation: rotation ?? state.entities[id].rotation,
          },
        },
      };
    }),
});
