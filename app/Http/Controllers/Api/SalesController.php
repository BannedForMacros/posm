<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    // Ventas agrupadas por familia
    public function salesByFamily()
    {
        $data = DB::select('CALL sp_getSalesByFamily()');
        return response()->json($data);
    }

    // Ventas agrupadas por mes
    public function salesByMonth()
    {
        $data = DB::select('CALL sp_getSalesByMonth()');
        return response()->json($data);
    }

    // Ventas agrupadas por día
    public function salesByDay()
    {
        $data = DB::select('CALL sp_getSalesByDay()');
        return response()->json($data);
    }
}
