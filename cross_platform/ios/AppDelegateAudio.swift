/**
 * AppDelegateAudio.swift
 * iOS 原生后台音频会话与锁屏中心控制 (MediaPlayer / AVFoundation)
 */

import UIKit
import AVFoundation
import MediaPlayer

class AudioSessionManager {
    static let shared = AudioSessionManager()
    
    private init() {}
    
    /// 激活 iOS 后台音频播放模式，允许锁屏和静音开关下持续发声
    func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers, .allowBluetooth, .allowAirPlay])
            try session.setActive(true)
            print("[iOS Audio] AVAudioSession CategoryPlayback activated.")
            
            setupRemoteCommandCenter()
        } catch {
            print("[iOS Audio] Failed to set AVAudioSession category: \(error)")
        }
    }
    
    /// 注册锁屏与控制中心按键响应
    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()
        
        commandCenter.playCommand.addTarget { event in
            NotificationCenter.default.post(name: Notification.Name("AppAudioPlay"), object: nil)
            return .success
        }
        
        commandCenter.pauseCommand.addTarget { event in
            NotificationCenter.default.post(name: Notification.Name("AppAudioPause"), object: nil)
            return .success
        }
        
        commandCenter.togglePlayPauseCommand.addTarget { event in
            NotificationCenter.default.post(name: Notification.Name("AppAudioToggle"), object: nil)
            return .success
        }
    }
    
    /// 更新锁屏播控面板元数据
    func updateNowPlaying(title: String, subtitle: String) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = subtitle
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = "环球声景 · Country Soundscape"
        nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = true
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}
