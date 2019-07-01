import geopy.distance
import json
import sys
import xml.etree.ElementTree as ET


def main():
	input_file_path = sys.argv[1]
	output_file_path = sys.argv[2]
	
	gpx_root = load_gpx(input_file_path)
	points = get_tracking_points_from_gpx(gpx_root)

	coords_with_distances = get_coordinates_with_distance(points)
	current_point = createFeature('white', coords_with_distances[0], 'Point')
	current_point['properties']['distance-from-start'] = 0.0
	completed_feature = createFeature('green', [coords_with_distances[0]], 'LineString')
	incomplete_feature = createFeature('red', coords_with_distances, 'LineString')
	geojson = {'type': 'FeatureCollection', 'features': [current_point, completed_feature, incomplete_feature]}
	write_geojson_to_file(geojson, output_file_path)

def load_gpx(input_file_path):
	tree = ET.parse('/Users/aaronrosenheck/Documents/at/misc/geojson-prep/at_centerline_full_10k_split_500.gpx')
	return tree.getroot()

def get_tracking_points_from_gpx(gpx_root):
	points = gpx_root.findall('.//{http://www.topografix.com/GPX/1/0}trkpt')
	return list(map(lambda point: (float(point.attrib['lat']), float(point.attrib['lon'])), points))

def get_coordinates_with_distance(points):
	total_distance = 0
	coordinates = [list(points[0][::-1] + (0.0, ))]
	for i in range(len(points) - 1):
		distance = geopy.distance.distance(points[i], points[i + 1]).m
		total_distance += distance
		coordinates.append(list(points[i + 1][::-1] + (total_distance, )))
	return coordinates

def write_geojson_to_file(geojson, output_file_path):
	f= open(output_file_path, 'w+')
	f.write(json.dumps(geojson))
	f.close()

def createFeature(color, coordinates, type):
	return {
		'type': 'Feature',
		'properties': {
			'color': color,
		},
		'geometry': {
			'type': type,
			'coordinates': coordinates
		}
	}
  
if __name__== "__main__":
  main()