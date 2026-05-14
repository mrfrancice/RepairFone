// Shared Models
export * from './models';

// Shared Components - UI Kit
export { UiButtonComponent } from './components/ui-button/ui-button.component';
export { UiInputComponent } from './components/ui-input/ui-input.component';
export { UiCardComponent } from './components/ui-card/ui-card.component';
export { UiModalComponent } from './components/ui-modal/ui-modal.component';
export { UiLoadingComponent } from './components/ui-loading/ui-loading.component';
export { UiBadgeComponent } from './components/ui-badge/ui-badge.component';
export { UiAvatarComponent } from './components/ui-avatar/ui-avatar.component';
export { UiAlertComponent } from './components/ui-alert/ui-alert.component';
export { UiTabsComponent } from './components/ui-tabs/ui-tabs.component';
export { UiSelectComponent } from './components/ui-select/ui-select.component';
export { UiCheckboxComponent } from './components/ui-checkbox/ui-checkbox.component';
export { UiRatingComponent } from './components/ui-rating/ui-rating.component';
export { UiChipComponent } from './components/ui-chip/ui-chip.component';
export { UiEmptyStateComponent } from './components/ui-empty-state/ui-empty-state.component';
export { UiErrorStateComponent, type ErrorSeverity } from './components/ui-error-state/ui-error-state.component';
export { UiSearchBarComponent } from './components/ui-search-bar/ui-search-bar.component';
export { UiBottomSheetComponent } from './components/ui-bottom-sheet/ui-bottom-sheet.component';
export { UiConfirmationDialogComponent } from './components/ui-confirmation-dialog/ui-confirmation-dialog.component';
export { UiImageUploadComponent } from './components/ui-image-upload/ui-image-upload.component';
export { UiMapComponent } from './components/ui-map/ui-map.component';
export { UiPriceDisplayComponent } from './components/ui-price-display/ui-price-display.component';
export { UiRadioGroupComponent } from './components/ui-radio-group/ui-radio-group.component';
export { UiSliderComponent } from './components/ui-slider/ui-slider.component';
export { UiSkeletonComponent } from './components/ui-skeleton/ui-skeleton.component';
export type { SkeletonVariant } from './components/ui-skeleton/ui-skeleton.component';
export { ToastContainerComponent } from './components/toast/toast-container.component';
export { NetworkStatusComponent } from './components/network-status/network-status.component';
export { UiListContainerComponent } from './components/ui-list-container/ui-list-container.component';

// Shared Pipes
export { RelativeTimePipe } from './pipes/relative-time.pipe';
export { FormatDatePipe } from './pipes/format-date.pipe';
export { TruncatePipe } from './pipes/truncate.pipe';
export { InitialsPipe } from './pipes/initials.pipe';
export { CurrencyXofPipe } from './pipes/currency-xof.pipe';
export { PhoneFormatPipe } from './pipes/phone-format.pipe';

// Shared Utils
export * from './utils/date.utils';
export * from './utils/format.utils';
export * from './utils/rating.utils';

// Shared Services
export { StatusLabelsService } from './services/status-labels.service';
export type {
  RequestStatus,
  QuoteStatus,
  DisputeStatus,
  PaymentStatus,
  PaymentType,
  UrgencyLevel,
  ChipVariant,
} from './services/status-labels.service';

// Shared Directives
export { PullToRefreshDirective } from './directives/pull-to-refresh.directive';
export { SwipeDirective } from './directives/swipe.directive';
export { DebounceDirective, DebounceClickDirective } from './directives/debounce.directive';
export { InfiniteScrollDirective } from './directives/infinite-scroll.directive';
export { ClickOutsideDirective } from './directives/click-outside.directive';
export type { PullToRefreshConfig } from './directives/pull-to-refresh.directive';
export type { SwipeDirection, SwipeEvent } from './directives/swipe.directive';
