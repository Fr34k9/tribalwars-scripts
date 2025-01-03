<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ScriptResource\Pages;
use App\Filament\Resources\ScriptResource\RelationManagers;
use App\Models\Script;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ScriptResource extends Resource
{
    protected static ?string $model = Script::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\FileUpload::make('image')
                    ->label('Image')
                    ->image(),
                Forms\Components\TextInput::make('title')
                    ->label('Title')
                    ->required(),
                Forms\Components\Textarea::make('short_description')
                    ->label('Short Description')
                    ->required(),
                Forms\Components\Textarea::make('long_description')
                    ->label('Long Description')
                    ->required(),
                Forms\Components\TagsInput::make('tags')
                    ->label('Tags')
                    ->required(),
                Forms\Components\FileUpload::make('file')
                    ->label('File')
                    ->preserveFilenames(),
                Forms\Components\TextInput::make('download_counter')
                    ->label('Download Counter')
                    ->numeric()
                    ->default(0)
                    ->disabled(),
                Forms\Components\TextInput::make('run_counter')
                    ->label('Run Counter')
                    ->numeric()
                    ->default(0)
                    ->disabled(),
                Forms\Components\TextInput::make('version')
                    ->label('Version')
                    ->required(),
                Forms\Components\Toggle::make('is_active')
                    ->label('Is Active')
                    ->default(true),
            ])
            ->columns(1);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TagsColumn::make('tags')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\ImageColumn::make('image')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('download_counter')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('run_counter')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('file')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('version')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\BooleanColumn::make('is_active')
                    ->label('Is Active')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->label('Created At'),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->label('Updated At'),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListScripts::route('/'),
            'create' => Pages\CreateScript::route('/create'),
            'edit' => Pages\EditScript::route('/{record}/edit'),
        ];
    }
}
