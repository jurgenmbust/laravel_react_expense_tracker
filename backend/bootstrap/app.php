<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {})
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());
        $exceptions->render(function (NotFoundHttpException $error, Request $request) {
            if ($request->is('api/*')) return response()->json(['message' => 'Registro o ruta no encontrados.'], 404);
        });
        $exceptions->render(function (QueryException $error, Request $request) {
            if (!$request->is('api/*')) return null;
            $state = $error->errorInfo[0] ?? '';
            if ($state === '23505') return response()->json(['message' => 'Ya existe una categoría con ese nombre.'], 409);
            if ($state === '23503') return response()->json(['message' => 'El registro está en uso o su categoría ya no existe.'], 409);
            return response()->json(['message' => 'No se pudo completar la operación de base de datos.'], 500);
        });
    })->create();
