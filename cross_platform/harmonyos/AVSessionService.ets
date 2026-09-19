/**
 * AVSessionService.ets
 * 鸿蒙 HarmonyOS NEXT (ArkTS) 后台音频播放与播控中心 (AVSession) 集成示例
 * 兼容 API 11+ / HarmonyOS NEXT Developer Beta / Release
 */

import { avSession } from '@kit.AVSessionKit';
import { backgroundTaskManager } from '@kit.BackgroundTasksKit';
import { wantAgent, WantAgent } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';

export class HarmonyAudioService {
  private session: avSession.AVSession | null = null;
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  /**
   * 初始化鸿蒙长音频后台会话
   */
  async initAVSession(countryTitle: string, countryDesc: string): Promise<void> {
    try {
      // 1. 创建音频类型 AVSession
      this.session = await avSession.createAVSession(this.context, 'CountrySoundscapeSession', 'audio');
      await this.session.activate();

      // 2. 设置控制中心与锁屏卡片元数据
      const metadata: avSession.AVMetadata = {
        assetId: 'country_noise_001',
        title: countryTitle,
        artist: '环球声景',
        description: countryDesc,
        duration: -1 // 持续生成白噪音与音乐，无固定结束时间
      };
      await this.session.setAVMetadata(metadata);

      // 3. 设置播放状态（播放中）
      const playbackState: avSession.AVPlaybackState = {
        state: avSession.PlaybackState.PLAYBACK_STATE_PLAY,
        speed: 1.0,
        position: {
          elapsedTime: 0,
          updateTime: new Date().getTime()
        }
      };
      await this.session.setAVPlaybackState(playbackState);

      // 4. 监听系统播控面板（播控中心/耳机按键）
      this.session.on('play', () => {
        console.info('[HarmonyOS Audio] Remote play triggered');
        // 调用 Web 组件内部执行 playPlayback()
      });

      this.session.on('pause', () => {
        console.info('[HarmonyOS Audio] Remote pause triggered');
        // 调用 Web 组件内部执行 pausePlayback()
      });

      // 5. 申请后台长任务保活
      await this.startContinuousTask();

    } catch (err) {
      const error = err as BusinessError;
      console.error(`Failed to init AVSession: code=${error.code}, message=${error.message}`);
    }
  }

  /**
   * 申请后台长任务 (KEEP_BACKGROUND_RUNNING)
   */
  private async startContinuousTask(): Promise<void> {
    const wantAgentInfo: wantAgent.WantAgentInfo = {
      wants: [
        {
          bundleName: 'com.example.country_noise',
          abilityName: 'EntryAbility'
        }
      ],
      actionType: wantAgent.OperationType.START_ABILITY,
      requestCode: 0,
      wantAgentFlags: [wantAgent.WantAgentFlag.UPDATE_PRESENT_FLAG]
    };

    const agent: WantAgent = await wantAgent.getWantAgent(wantAgentInfo);
    // 注册音频播放长任务
    await backgroundTaskManager.startBackgroundRunning(this.context, backgroundTaskManager.BackgroundMode.AUDIO_PLAYBACK, agent);
  }

  /**
   * 停止并释放会话
   */
  async destroySession(): Promise<void> {
    if (this.session) {
      await this.session.destroy();
      this.session = null;
    }
    await backgroundTaskManager.stopBackgroundRunning(this.context);
  }
}
