<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Carbon;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-users';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('name')
                ->required()
                ->maxLength(255),
            Forms\Components\TextInput::make('email')
                ->email()
                ->required()
                ->maxLength(255),
            Forms\Components\TextInput::make('password')
                ->password()
                ->revealable()
                ->dehydrated(fn ($state) => filled($state))
                ->nullable(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('email')->searchable()->sortable(),
                Tables\Columns\BadgeColumn::make('subscription_status')
                    ->label('Subscription')
                    ->getStateUsing(fn (User $record) => $record->subscribed() ? 'Active' : 'Inactive')
                    ->colors([
                        'success' => 'Active',
                        'danger'  => 'Inactive',
                    ]),
                Tables\Columns\TextColumn::make('subscription_ends')
                    ->label('Ends At')
                    ->getStateUsing(function (User $record) {
                        $sub = $record->subscription();

                        return $sub?->ends_at?->format('Y-m-d') ?? ($sub ? 'Ongoing' : '—');
                    }),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('grant_access')
                    ->label('Grant Free Access')
                    ->icon('heroicon-o-gift')
                    ->color('success')
                    ->form([
                        Forms\Components\DatePicker::make('ends_at')
                            ->label('Access Until')
                            ->required()
                            ->minDate(now()),
                    ])
                    ->action(function (User $record, array $data): void {
                        $existing = $record->subscription();

                        if ($existing) {
                            $existing->update(['ends_at' => Carbon::parse($data['ends_at'])]);
                        } else {
                            $record->subscriptions()->create([
                                'type'          => 'default',
                                'name'          => 'default',
                                'stripe_id'     => 'manual_' . $record->id,
                                'stripe_status' => 'active',
                                'ends_at'       => Carbon::parse($data['ends_at']),
                            ]);
                        }
                    }),
                Tables\Actions\Action::make('extend_subscription')
                    ->label('Extend')
                    ->icon('heroicon-o-calendar')
                    ->color('warning')
                    ->form([
                        Forms\Components\DatePicker::make('ends_at')
                            ->label('New End Date')
                            ->required()
                            ->minDate(now()),
                    ])
                    ->action(function (User $record, array $data): void {
                        $record->subscription()?->update(['ends_at' => Carbon::parse($data['ends_at'])]);
                    })
                    ->visible(fn (User $record) => $record->subscribed()),
                Tables\Actions\Action::make('cancel_subscription')
                    ->label('Cancel')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function (User $record): void {
                        $record->subscription()?->update(['ends_at' => now(), 'stripe_status' => 'canceled']);
                    })
                    ->visible(fn (User $record) => $record->subscribed()),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit'   => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
