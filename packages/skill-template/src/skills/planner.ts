import {
  Icon,
  SkillInvocationConfig,
  SkillTemplateConfigDefinition,
} from '@refly-packages/openapi-schema';
import { StateGraph, StateGraphArgs, START, END } from '@langchain/langgraph';
import { Runnable } from '@langchain/core/runnables';
import { AIMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { BaseSkill, BaseSkillState, baseStateGraphArgs } from '../base';

export class Planner extends BaseSkill {
  name = 'planner';

  icon: Icon = { type: 'emoji', value: '🤖' };

  description = 'Planner';

  schema = z.object({
    query: z.string().optional().describe('The question to be answered'),
    images: z.array(z.string()).optional().describe('The images to be read by the skill'),
  });

  configSchema: SkillTemplateConfigDefinition = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  async sayHello(): Promise<Partial<BaseSkillState>> {
    return {
      messages: [new AIMessage('Hello, world!')],
    };
  }

  toRunnable(): Runnable {
    const workflow = new StateGraph<BaseSkillState>({
      channels: this.graphState,
    }).addNode('planner', this.sayHello);

    workflow.addEdge(START, 'planner');
    workflow.addEdge('planner', END);

    return workflow.compile();
  }
}
