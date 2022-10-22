import geopy.distance
import json
import sys
import xml.etree.ElementTree as ET
def main():
	# input_file_path = sys.argv[1]
	# output_file_path = sys.argv[2]
	gpx_root = load_gpx()
	points = get_tracking_points_from_gpx(gpx_root)
	print len(points)

	get_coordinates_with_distance(points)

def load_gpx():
	tree = ET.parse('/Users/aaronrosenheck/Documents/at-la/misc/geojson-prep/at_centerline_full_10k_split_500.gpx')
	return tree.getroot()

def get_tracking_points_from_gpx(gpx_root):
	points = gpx_root.findall('.//{http://www.topografix.com/GPX/1/0}trkpt')
	return list(map(lambda point: (float(point.attrib['lat']), float(point.attrib['lon'])), points))

def get_coordinates_with_distance(points):
	target = (40.808512, -75.51581)
	minimum = sys.maxint
	winner = None
	coordinates = [list(points[0][::-1] + (0.0, ))]
	for i in range(len(points) - 1):
		distance = geopy.distance.distance(points[i], target).m
		if distance < minimum:
			minimum = distance
			winner = points[i]
	print minimum
	print winner
  
if __name__== "__main__":
  main()