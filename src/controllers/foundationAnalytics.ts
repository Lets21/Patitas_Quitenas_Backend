import { Request, Response, NextFunction } from "express";
import { Animal } from "../models/Animal";
import { Application } from "../models/Application";
import { Types } from "mongoose";

/**
 * Controlador para obtener estadísticas avanzadas y analytics de la fundación
 * GET /api/v1/foundation/analytics
 */
export async function getFoundationAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const foundationId = req.user!.id;
    const foundationObjectId = new Types.ObjectId(foundationId);

    // 1. ADOPCIONES POR MES (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const adoptionsByMonth = await Animal.aggregate([
      {
        $match: {
          foundationId: foundationObjectId,
          state: "ADOPTED",
          updatedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Formatear para el frontend
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const adoptionsTimeline = adoptionsByMonth.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count,
    }));

    // 2. PERROS CON MÁS SOLICITUDES
    const topAnimalsWithApplications = await Application.aggregate([
      { $match: { foundationId: foundationObjectId } },
      {
        $group: {
          _id: "$animalId",
          applicationCount: { $sum: 1 },
        },
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "animals",
          localField: "_id",
          foreignField: "_id",
          as: "animal",
        },
      },
      { $unwind: "$animal" },
      {
        $project: {
          animalId: "$_id",
          name: "$animal.name",
          breed: "$animal.attributes.breed",
          age: "$animal.attributes.age",
          ageMonths: "$animal.ageMonths",
          applicationCount: 1,
          photos: "$animal.photos",
          state: "$animal.state",
        },
      },
    ]);

    // 3. TOTAL DE PERROS Y ADOPTADOS (necesario para otras métricas)
    const totalDogs = await Animal.countDocuments({ foundationId: foundationObjectId });
    const adoptedDogs = await Animal.countDocuments({
      foundationId: foundationObjectId,
      state: "ADOPTED",
    });

    // 4. DISTRIBUCIÓN DE PERROS POR ESTADO
    const stateDistribution = await Animal.aggregate([
      { $match: { foundationId: foundationObjectId } },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null }, // Filtrar valores null
        },
      },
    ]);

    // Si no hay datos, agregar valores por defecto
    if (stateDistribution.length === 0 && totalDogs > 0) {
      stateDistribution.push({ _id: "AVAILABLE", count: totalDogs });
    }

    // 5. TASA DE ADOPCIÓN (% de perros adoptados del total)
    const adoptionRate = totalDogs > 0 ? (adoptedDogs / totalDogs) * 100 : 0;

    // 6. SOLICITUDES POR ESTADO
    const applicationsByStatus = await Application.aggregate([
      { $match: { foundationId: foundationObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null }, // Filtrar valores null
        },
      },
    ]);

    // 7. TIEMPO PROMEDIO HASTA ADOPCIÓN
    const adoptedAnimals = await Animal.find({
      foundationId: foundationObjectId,
      state: "ADOPTED",
    }).select("createdAt updatedAt");

    let avgDaysToAdoption = 0;
    if (adoptedAnimals.length > 0) {
      const totalDays = adoptedAnimals.reduce((sum, animal) => {
        const days = Math.floor(
          (animal.updatedAt.getTime() - animal.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgDaysToAdoption = Math.round(totalDays / adoptedAnimals.length);
    }

    // 8. ADOPCIONES RECIENTES (últimas 5)
    const recentAdoptions = await Animal.find({
      foundationId: foundationObjectId,
      state: "ADOPTED",
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name attributes.breed attributes.age ageMonths updatedAt photos");

    // 9. PERROS POR TAMAÑO
    const dogsBySize = await Animal.aggregate([
      { $match: { foundationId: foundationObjectId } },
      {
        $group: {
          _id: "$attributes.size",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);

    // 10. PERROS POR NIVEL DE ENERGÍA
    const dogsByEnergy = await Animal.aggregate([
      { $match: { foundationId: foundationObjectId } },
      {
        $group: {
          _id: "$attributes.energy",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);

    // 11. TENDENCIA DE REGISTRO DE PERROS (últimos 6 meses)
    const registrationTrend = await Animal.aggregate([
      {
        $match: {
          foundationId: foundationObjectId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const registrationTimeline = registrationTrend.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count,
    }));

    return res.json({
      ok: true,
      data: {
        adoptionsTimeline,
        topAnimalsWithApplications,
        stateDistribution,
        adoptionRate: Math.round(adoptionRate * 10) / 10,
        applicationsByStatus,
        avgDaysToAdoption,
        recentAdoptions,
        dogsBySize,
        dogsByEnergy,
        registrationTimeline,
        summary: {
          totalDogs,
          adoptedDogs,
          totalApplications: await Application.countDocuments({
            foundationId: foundationObjectId,
          }),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
