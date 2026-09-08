import { useCallback, useEffect, useState } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../services/courseService";

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCourses(await getCourses());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addCourse(data) {
    await createCourse(data);
    await reload();
  }

  async function editCourse(id, data) {
    await updateCourse(id, data);
    await reload();
  }

  async function removeCourse(id) {
    await deleteCourse(id);
    await reload();
  }

  return { courses, loading, error, addCourse, editCourse, removeCourse, reload };
}
