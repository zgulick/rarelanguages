/**
 * Enterprise Loading State Component
 * Demonstrates sophisticated loading patterns and user experience optimization
 */

import { 
  Component, 
  Input, 
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Observable, timer, interval, BehaviorSubject } from 'rxjs';
import { map, takeWhile, startWith, takeUntil } from 'rxjs/operators';

export interface LoadingConfig {
  type: 'spinner' | 'progress' | 'skeleton' | 'dots' | 'pulse';
  message?: string;
  showProgress?: boolean;
  showTimer?: boolean;
  estimatedDuration?: number; // milliseconds
  showTips?: boolean;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

export interface LoadingTip {
  icon: string;
  text: string;
  category: 'performance' | 'feature' | 'tip';
}

@Component({
  selector: 'app-loading-state',
  templateUrl: './loading-state.component.html',
  styleUrls: ['./loading-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingStateComponent implements OnInit, OnDestroy {
  @Input() config: LoadingConfig = {
    type: 'spinner',
    message: 'Loading...',
    size: 'medium',
    overlay: false
  };

  @Input() isLoading: boolean = true;
  @Input() context: string = 'general';

  // Observable streams
  private destroy$ = new BehaviorSubject<boolean>(false);
  
  loadingTimer$: Observable<string> | null = null;
  progressPercent$: Observable<number> | null = null;
  currentTip$: Observable<LoadingTip> | null = null;

  // Performance tracking
  private startTime: number = 0;
  private performanceThresholds = {
    fast: 500,      // Under 500ms is fast
    normal: 2000,   // Under 2s is normal  
    slow: 5000      // Over 5s is slow
  };

  // Loading tips for user engagement
  private loadingTips: LoadingTip[] = [
    {
      icon: 'speed',
      text: 'We cache frequently accessed data to improve performance',
      category: 'performance'
    },
    {
      icon: 'security',
      text: 'All data is encrypted in transit and at rest',
      category: 'feature'
    },
    {
      icon: 'cloud_sync',
      text: 'Data is automatically synchronized across devices',
      category: 'feature'
    },
    {
      icon: 'analytics',
      text: 'Advanced filtering helps you find assets quickly',
      category: 'tip'
    },
    {
      icon: 'autorenew',
      text: 'Use keyboard shortcuts to navigate faster: Ctrl+K for search',
      category: 'tip'
    },
    {
      icon: 'backup',
      text: 'Your work is automatically saved every few seconds',
      category: 'feature'
    },
    {
      icon: 'insights',
      text: 'Export your data to Excel, PDF, or CSV formats',
      category: 'tip'
    },
    {
      icon: 'notifications',
      text: 'Get real-time updates when asset statuses change',
      category: 'feature'
    }
  ];

  // Size configurations
  spinnerSizes = {
    small: 20,
    medium: 40,
    large: 60
  };

  ngOnInit(): void {
    if (this.isLoading) {
      this.startLoadingTracking();
      this.initializeLoadingStreams();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private startLoadingTracking(): void {
    this.startTime = performance.now();
    
    console.log('⏱️ Loading started:', {
      context: this.context,
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }

  private initializeLoadingStreams(): void {
    // Initialize timer if enabled
    if (this.config.showTimer) {
      this.loadingTimer$ = timer(0, 100).pipe(
        map(tick => this.formatElapsedTime(tick * 100)),
        takeUntil(this.destroy$)
      );
    }

    // Initialize progress simulation if enabled
    if (this.config.showProgress && this.config.estimatedDuration) {
      this.progressPercent$ = timer(0, 100).pipe(
        map(tick => {
          const elapsed = tick * 100;
          const estimated = this.config.estimatedDuration!;
          const progress = Math.min(95, (elapsed / estimated) * 100);
          
          // Add some realistic variation
          const variation = Math.sin(elapsed / 1000) * 2;
          return Math.max(0, progress + variation);
        }),
        takeWhile(progress => progress < 95),
        startWith(0),
        takeUntil(this.destroy$)
      );
    }

    // Initialize rotating tips if enabled
    if (this.config.showTips) {
      this.currentTip$ = interval(3000).pipe(
        map(index => this.loadingTips[index % this.loadingTips.length]),
        startWith(this.loadingTips[0]),
        takeUntil(this.destroy$)
      );
    }
  }

  private formatElapsedTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    
    if (seconds === 0) {
      return `${ms}ms`;
    } else if (seconds < 60) {
      return `${seconds}.${Math.floor(ms / 100)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  getLoadingMessage(): string {
    if (!this.isLoading) return '';

    const elapsed = performance.now() - this.startTime;
    
    // Adaptive messaging based on loading time
    if (elapsed > this.performanceThresholds.slow) {
      return `${this.config.message} - This is taking longer than usual...`;
    } else if (elapsed > this.performanceThresholds.normal) {
      return `${this.config.message} - Almost ready...`;
    }
    
    return this.config.message || 'Loading...';
  }

  getSpinnerDiameter(): number {
    return this.spinnerSizes[this.config.size || 'medium'];
  }

  getSkeletonConfig(): any {
    // Configuration for skeleton loading based on context
    const skeletonConfigs: Record<string, any> = {
      'asset-list': {
        rows: 5,
        columns: ['40%', '25%', '20%', '15%'],
        showAvatar: false
      },
      'asset-detail': {
        rows: 8,
        columns: ['100%'],
        showAvatar: true,
        showHeader: true
      },
      'dashboard': {
        rows: 3,
        columns: ['30%', '30%', '40%'],
        showCards: true
      },
      'general': {
        rows: 4,
        columns: ['60%', '40%'],
        showAvatar: false
      }
    };

    return skeletonConfigs[this.context] || skeletonConfigs['general'];
  }

  getPerformanceClass(): string {
    const elapsed = performance.now() - this.startTime;
    
    if (elapsed < this.performanceThresholds.fast) {
      return 'loading-fast';
    } else if (elapsed < this.performanceThresholds.normal) {
      return 'loading-normal';
    } else if (elapsed < this.performanceThresholds.slow) {
      return 'loading-slow';
    } else {
      return 'loading-very-slow';
    }
  }

  // Template helper methods
  getContainerClasses(): string[] {
    const classes = [
      'loading-container',
      `loading-${this.config.type}`,
      `loading-${this.config.size}`,
      this.getPerformanceClass()
    ];

    if (this.config.overlay) {
      classes.push('loading-overlay');
    }

    return classes;
  }

  shouldShowCancelOption(): boolean {
    const elapsed = performance.now() - this.startTime;
    return elapsed > this.performanceThresholds.slow;
  }

  onCancel(): void {
    console.log('❌ Loading cancelled by user after:', this.formatElapsedTime(performance.now() - this.startTime));
    // Emit cancel event or call parent method
  }

  // For demonstration - simulate different loading scenarios
  simulateSlowLoading(): void {
    this.config = {
      ...this.config,
      type: 'progress',
      message: 'Processing large dataset...',
      showProgress: true,
      showTimer: true,
      estimatedDuration: 8000,
      showTips: true
    };
    this.ngOnInit();
  }

  simulateFastLoading(): void {
    this.config = {
      ...this.config,
      type: 'spinner',
      message: 'Loading from cache...',
      showProgress: false,
      showTimer: false,
      estimatedDuration: 500
    };
    this.ngOnInit();
  }

  simulateSkeletonLoading(): void {
    this.config = {
      ...this.config,
      type: 'skeleton',
      message: 'Preparing interface...',
      showTips: false
    };
    this.ngOnInit();
  }
}