import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { ChatMessages } from './chat-messages';
import { ConvListModal } from './conv-list-modal';
import { KnowledgeBaseListModal } from './knowledge-base-list-modal';
import { SkillManagementModal } from '@refly-packages/ai-workspace-common/components/skill/skill-management-modal';
import { CopilotOperationModule } from './copilot-operation-module';
import { CopilotChatHeader } from './chat-header';

// state
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useResetState } from '@refly-packages/ai-workspace-common/hooks/use-reset-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { ActionSource } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseStore } from '../../../stores/knowledge-base';
// utils
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useResizeCopilot } from '@refly-packages/ai-workspace-common/hooks/use-resize-copilot';
import { RegisterSkillComponent } from '@refly-packages/ai-workspace-common/skills/main-logic/register-skill-component';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { useDynamicInitContextPanelState } from '@refly-packages/ai-workspace-common/hooks/use-init-context-panel-state';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

import './index.scss';

interface AICopilotProps {
  disable?: boolean;
  source?: string;
  jobId?: string;
}

export const AICopilot = memo((props: AICopilotProps) => {
  const [searchParams] = useSearchParams();
  const convId = searchParams.get('convId');

  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
    kbModalVisible: state.kbModalVisible,
    actionSource: state.actionSource,
    tempConvResources: state.tempConvResources,
    updateConvModalVisible: state.updateConvModalVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
    currentKnowledgeBase: state.currentKnowledgeBase,
    convModalVisible: state.convModalVisible,
    sourceListModalVisible: state.sourceListModalVisible,
  }));

  const contextPanelStore = useContextPanelStore((state) => ({
    setShowContextCard: state.setShowContextCard,
  }));

  const chatStore = useChatStore((state) => ({
    messages: state.messages,
    resetState: state.resetState,
    setMessages: state.setMessages,
    setInvokeParams: state.setInvokeParams,
  }));

  const conversationStore = useConversationStore((state) => ({
    isNewConversation: state.isNewConversation,
    currentConversation: state.currentConversation,
    resetState: state.resetState,
    setCurrentConversation: state.setCurrentConversation,
    setIsNewConversation: state.setIsNewConversation,
  }));

  const [isFetching, setIsFetching] = useState(false);

  const { runSkill } = useBuildThreadAndRun();

  const { resetState } = useResetState();

  const { disable, jobId, source } = props;

  const copilotOperationModuleRef = useRef<HTMLDivElement>(null);
  const [operationModuleHeight, setOperationModuleHeight] = useState(0);

  const updateOperationModuleHeight = useCallback(() => {
    if (copilotOperationModuleRef.current) {
      setOperationModuleHeight(copilotOperationModuleRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    updateOperationModuleHeight();

    const resizeObserver = new ResizeObserver(updateOperationModuleHeight);
    if (copilotOperationModuleRef.current) {
      resizeObserver.observe(copilotOperationModuleRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateOperationModuleHeight]);

  const isFromSkillJob = () => {
    return source === 'skillJob';
  };

  // ai-note handler
  useAINote(true);

  const handleGetThreadMessages = async (convId: string) => {
    const { data: res, error } = await getClient().getConversationDetail({
      path: {
        convId,
      },
    });

    if (error) {
      throw error;
    }

    resetState();

    if (res?.data) {
      conversationStore.setCurrentConversation(res?.data);
    }

    chatStore.setMessages(res.data.messages);
  };

  const getThreadMessagesByJobId = async (jobId: string) => {
    setIsFetching(true);

    const { data: res, error } = await getClient().getSkillJobDetail({
      query: {
        jobId,
      },
    });

    if (error) {
      throw error;
    }

    resetState();

    setIsFetching(false);
    chatStore.setMessages(res?.data?.messages || []);
  };

  const handleConvTask = async (convId: string) => {
    try {
      setIsFetching(true);
      const { newQAText, invokeParams } = useChatStore.getState();
      const { isNewConversation } = useConversationStore.getState();

      // 新会话，需要手动构建第一条消息
      if (isNewConversation && convId) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        runSkill(newQAText, invokeParams);
      } else if (convId) {
        await handleGetThreadMessages(convId);
      }
    } catch (err) {
      console.log('thread error');
    }

    setIsFetching(false);

    // reset state
    conversationStore.setIsNewConversation(false);
    chatStore.setInvokeParams({});
  };

  useEffect(() => {
    if (convId && !isFromSkillJob()) {
      handleConvTask(convId);
    }

    if (jobId && isFromSkillJob()) {
      getThreadMessagesByJobId(jobId);
    }

    return () => {
      chatStore.setMessages([]);
    };
  }, [convId, jobId]);
  useResizeCopilot({ containerSelector: 'ai-copilot-container' });
  useDynamicInitContextPanelState(); // 动态根据页面状态更新上下文面板状态

  useEffect(() => {
    const runtime = getRuntime();

    if (runtime === 'web') {
      contextPanelStore.setShowContextCard(false);
    }
  }, []);

  return (
    <div className="ai-copilot-container">
      <CopilotChatHeader />
      <div className="ai-copilot-body-container">
        <div
          className="ai-copilot-message-container"
          style={{ height: `calc(100% - ${disable ? 0 : operationModuleHeight}px)` }}
        >
          <ChatMessages disable={disable} loading={isFetching} />
        </div>
        {!disable && <CopilotOperationModule ref={copilotOperationModuleRef} source={source} />}
      </div>

      {knowledgeBaseStore?.convModalVisible ? <ConvListModal title="会话库" classNames="conv-list-modal" /> : null}
      {knowledgeBaseStore?.kbModalVisible && knowledgeBaseStore.actionSource === ActionSource.Conv ? (
        <KnowledgeBaseListModal title="知识库" classNames="kb-list-modal" />
      ) : null}
      {knowledgeBaseStore?.sourceListModalVisible ? (
        <SourceListModal
          title={`结果来源 (${knowledgeBaseStore?.tempConvResources?.length || 0})`}
          classNames="source-list-modal"
          resources={knowledgeBaseStore?.tempConvResources || []}
        />
      ) : null}

      {/** 注册 Skill 相关内容，目前先收敛在 Copilot 内部，后续允许挂在在其他扩展点，比如笔记、reading */}
      <RegisterSkillComponent />
      <SkillManagementModal />
    </div>
  );
});
